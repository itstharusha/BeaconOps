// FILE: src/agents/scoringEngine/supplierScoring.js
// SPEC REFERENCE: Section 10 - Supplier Risk Scoring Model
// Formula: delayScore(30%) + financialScore(25%) + defectScore(20%) + disputeScore(15%) + geoScore(10%)
// Confidence: starts at 100, -20 per missing/stale metric, -20 if no shipments in 90 days

const { RISK_TIERS, DEFAULT_RISK_THRESHOLDS } = require('../../utils/constants');
const { isOlderThanDays } = require('../../utils/dateHelpers');

/**
 * Calculate supplier risk score using exact formula from spec §10
 * @param {object} supplier - Supplier document
 * @param {object} thresholds - Risk thresholds from OrganizationConfig (optional, uses defaults)
 * @returns {{ overallScore, riskTier, components, confidence, lowConfidence, confidenceWarning }}
 */
const calculateSupplierRisk = (supplier, thresholds = DEFAULT_RISK_THRESHOLDS.supplier) => {
    const metrics = supplier.performanceMetrics || {};
    const financial = supplier.financialStability || {};

    let confidence = 100;
    const warnings = [];

    // ─── COMPONENT 1: Delay Score (weight: 30%) ──────────────────────────────
    // delayScore = (1 - onTimeDeliveryRate/100) * 100
    let delayScore = 0;
    if (metrics.onTimeDeliveryRate !== undefined && metrics.onTimeDeliveryRate !== null) {
        delayScore = (1 - metrics.onTimeDeliveryRate / 100) * 100;
        delayScore = Math.max(0, Math.min(100, delayScore));
    } else {
        delayScore = 50; // Default: medium risk when data missing
        confidence -= 20;
        warnings.push('On-time delivery rate unavailable');
    }

    // ─── COMPONENT 2: Financial Score (weight: 25%) ───────────────────────────
    // financialScore = 100 - financialStability.score
    let financialScore = 0;
    if (financial.score !== undefined && financial.score !== null) {
        financialScore = 100 - financial.score;
        financialScore = Math.max(0, Math.min(100, financialScore));

        // Check if financial data is stale (>90 days)
        if (financial.lastUpdated && isOlderThanDays(financial.lastUpdated, 90)) {
            confidence -= 20;
            warnings.push('Financial stability data is older than 90 days');
        }
    } else {
        financialScore = 50; // Default: medium risk (score = 50 means neutral)
        confidence -= 20;
        warnings.push('Financial stability score unavailable');
    }

    // ─── COMPONENT 3: Defect Score (weight: 20%) ──────────────────────────────
    // defectScore = defectRate (already a percentage)
    let defectScore = 0;
    if (metrics.defectRate !== undefined && metrics.defectRate !== null) {
        defectScore = Math.max(0, Math.min(100, metrics.defectRate));
    } else {
        defectScore = 0; // Default: assume no defects if unknown
        confidence -= 10;
        warnings.push('Defect rate unavailable');
    }

    // ─── COMPONENT 4: Dispute Score (weight: 15%) ─────────────────────────────
    // disputeScore = Math.min(disputeFrequency * 5, 50)
    let disputeScore = 0;
    if (metrics.disputeFrequency !== undefined && metrics.disputeFrequency !== null) {
        disputeScore = Math.min(metrics.disputeFrequency * 5, 50);
    } else {
        disputeScore = 0;
        confidence -= 10;
        warnings.push('Dispute frequency unavailable');
    }

    // ─── COMPONENT 5: Geopolitical Score (weight: 10%) ────────────────────────
    // geoScore = geopoliticalRiskFlag ? 20 : 0
    const geoScore = supplier.geopoliticalRiskFlag ? 20 : 0;

    // ─── OVERALL SCORE (weighted sum) ─────────────────────────────────────────
    const overallScore = Math.round(
        (delayScore * 0.30) +
        (financialScore * 0.25) +
        (defectScore * 0.20) +
        (disputeScore * 0.15) +
        (geoScore * 0.10)
    );

    // ─── ADDITIONAL CONFIDENCE PENALTY: No shipments in 90 days ──────────────
    if (metrics.lastUpdated && isOlderThanDays(metrics.lastUpdated, 90)) {
        confidence -= 20;
        warnings.push('No shipment data in the last 90 days');
    }

    confidence = Math.max(0, Math.min(100, confidence));
    const lowConfidence = confidence < 60;

    // ─── RISK TIER CLASSIFICATION ─────────────────────────────────────────────
    const riskTier = classifyRiskTier(overallScore, thresholds);

    return {
        overallScore,
        riskTier,
        components: {
            delayScore: Math.round(delayScore),
            financialScore: Math.round(financialScore),
            defectScore: Math.round(defectScore),
            disputeScore: Math.round(disputeScore),
            geopoliticalScore: geoScore,
        },
        confidence,
        lowConfidence,
        confidenceWarning: warnings.length > 0 ? warnings.join('; ') : null,
        scoreType: 'supplierRisk',
    };
};

/**
 * Classify risk tier based on score and configurable thresholds
 * Spec §10: low: 0-30, medium: 31-60, high: 61-80, critical: 81-100 (defaults)
 */
const classifyRiskTier = (score, thresholds) => {
    if (score > thresholds.high) return RISK_TIERS.CRITICAL;
    if (score > thresholds.medium) return RISK_TIERS.HIGH;
    if (score > thresholds.low) return RISK_TIERS.MEDIUM;
    return RISK_TIERS.LOW;
};

module.exports = { calculateSupplierRisk, classifyRiskTier };
