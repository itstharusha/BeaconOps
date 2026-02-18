// FILE: src/agents/scoringEngine/shipmentScoring.js
// SPEC REFERENCE: Section 10 - Shipment Risk Scoring Model
// Formula: etaDeviation(40%) + weather(25%) + route(20%) + carrier(10%) + trackingGap(5%)

const { RISK_TIERS, DEFAULT_RISK_THRESHOLDS } = require('../../utils/constants');
const { diffInHours, now } = require('../../utils/dateHelpers');

/**
 * Calculate shipment risk score using exact formula from spec §10
 * @param {object} shipment - Shipment document
 * @param {object} thresholds - Risk thresholds from OrganizationConfig
 * @returns {{ overallScore, riskTier, components, confidence, lowConfidence }}
 */
const calculateShipmentRisk = (shipment, thresholds = DEFAULT_RISK_THRESHOLDS.shipment) => {
    let confidence = 100;
    const warnings = [];

    // ─── COMPONENT 1: ETA Deviation Score (weight: 40%) ──────────────────────
    // etaDeviationScore = Math.min(Math.abs(etaDeviationHours) * 2, 50)
    // Positive deviation = delayed (past ETA), negative = early
    let etaDeviationScore = 0;
    if (shipment.estimatedArrival) {
        const currentTime = now();
        const etaDeviationHours = diffInHours(shipment.estimatedArrival, currentTime);
        // Only score if delayed (deviation > 0 means current time is past ETA)
        if (etaDeviationHours > 0) {
            etaDeviationScore = Math.min(etaDeviationHours * 2, 50);
        } else {
            etaDeviationScore = 0; // On time or early
        }
    } else {
        etaDeviationScore = 25; // Default: medium risk if no ETA
        confidence -= 20;
        warnings.push('Estimated arrival date not set');
    }

    // ─── COMPONENT 2: Weather Risk Score (weight: 25%) ────────────────────────
    // weatherScore = high→30, medium→15, low→0, severe→40
    const weatherRiskMap = { low: 0, medium: 15, high: 30, severe: 40 };
    const weatherScore = weatherRiskMap[shipment.weatherRisk] ?? 15;
    if (!shipment.weatherRisk) {
        confidence -= 10;
        warnings.push('Weather risk data unavailable, using medium default');
    }

    // ─── COMPONENT 3: Route Risk Score (weight: 20%) ──────────────────────────
    // routeScore = routeRiskIndex * 0.25
    let routeScore = 0;
    if (shipment.routeRiskIndex !== undefined && shipment.routeRiskIndex !== null) {
        routeScore = shipment.routeRiskIndex * 0.25;
        routeScore = Math.max(0, Math.min(25, routeScore));
    } else {
        routeScore = 0;
        confidence -= 10;
        warnings.push('Route risk index unavailable');
    }

    // ─── COMPONENT 4: Carrier Reliability Score (weight: 10%) ─────────────────
    // carrierScore = (100 - carrierReliability) * 0.20
    let carrierScore = 0;
    if (shipment.carrierReliability !== undefined && shipment.carrierReliability !== null) {
        carrierScore = (100 - shipment.carrierReliability) * 0.20;
        carrierScore = Math.max(0, Math.min(20, carrierScore));
    } else {
        carrierScore = 4; // Default: 80% reliability assumed
        confidence -= 10;
        warnings.push('Carrier reliability data unavailable');
    }

    // ─── COMPONENT 5: Tracking Gap Score (weight: 5%) ─────────────────────────
    // trackingGapScore = Math.min(trackingGapHours, 24)
    let trackingGapScore = 0;
    const trackingData = shipment.trackingData || [];
    if (trackingData.length > 0) {
        const lastEvent = trackingData[trackingData.length - 1];
        const gapHours = diffInHours(lastEvent.timestamp, now());
        trackingGapScore = Math.min(Math.max(0, gapHours), 24);
    } else {
        // No tracking events at all
        trackingGapScore = 24;
        confidence -= 15;
        warnings.push('No tracking events recorded');
    }

    // ─── OVERALL SCORE (weighted sum) ─────────────────────────────────────────
    const overallScore = Math.round(
        (etaDeviationScore * 0.40) +
        (weatherScore * 0.25) +
        (routeScore * 0.20) +
        (carrierScore * 0.10) +
        (trackingGapScore * 0.05)
    );

    confidence = Math.max(0, Math.min(100, confidence));
    const lowConfidence = confidence < 60;

    const riskTier = classifyShipmentRiskTier(overallScore, thresholds);

    return {
        overallScore: Math.min(100, overallScore),
        riskTier,
        components: {
            etaDeviationScore: Math.round(etaDeviationScore),
            weatherScore,
            routeScore: Math.round(routeScore),
            carrierScore: Math.round(carrierScore),
            trackingGapScore: Math.round(trackingGapScore),
        },
        confidence,
        lowConfidence,
        confidenceWarning: warnings.length > 0 ? warnings.join('; ') : null,
        scoreType: 'shipmentRisk',
    };
};

const classifyShipmentRiskTier = (score, thresholds) => {
    if (score > thresholds.high) return RISK_TIERS.CRITICAL;
    if (score > thresholds.medium) return RISK_TIERS.HIGH;
    if (score > thresholds.low) return RISK_TIERS.MEDIUM;
    return RISK_TIERS.LOW;
};

module.exports = { calculateShipmentRisk, classifyShipmentRiskTier };
