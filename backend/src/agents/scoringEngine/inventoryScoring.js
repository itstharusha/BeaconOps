// FILE: src/agents/scoringEngine/inventoryScoring.js
// SPEC REFERENCE: Section 10 - Inventory Risk Scoring Model
// Formula: stockoutProbability(50%) + demandVariance(30%) + supplierRiskAdjustment(20%)

const { RISK_TIERS, DEFAULT_RISK_THRESHOLDS } = require('../../utils/constants');

/**
 * Calculate inventory risk score using exact formula from spec §10
 * @param {object} inventory - Inventory document
 * @param {number} supplierRiskScore - Current supplier risk score (0-100)
 * @param {object} thresholds - Risk thresholds from OrganizationConfig
 * @returns {{ overallScore, riskTier, components, confidence, lowConfidence }}
 */
const calculateInventoryRisk = (inventory, supplierRiskScore = 50, thresholds = DEFAULT_RISK_THRESHOLDS.inventory) => {
    let confidence = 100;
    const warnings = [];

    const {
        currentStock = 0,
        averageDailyDemand = 0,
        leadTimeDays = 7,
        safetyStock = 0,
        reorderPoint = 0,
        demandForecast = [],
    } = inventory;

    // ─── COMPONENT 1: Stockout Probability (weight: 50%) ─────────────────────
    // daysOfCover = currentStock / averageDailyDemand
    // stockoutProbability = Math.max(Math.min(100 - (daysOfCover / (leadTimeDays * 1.5)) * 100, 100), 0)
    let stockoutProbability = 0;

    if (averageDailyDemand <= 0) {
        // No demand — no stockout risk
        stockoutProbability = 0;
        confidence -= 10;
        warnings.push('Average daily demand is zero or unavailable');
    } else {
        const daysOfCover = currentStock / averageDailyDemand;

        // Override logic per spec §10:
        if (daysOfCover < 1) {
            stockoutProbability = 100; // Imminent stockout
        } else if (currentStock < safetyStock) {
            stockoutProbability = 90; // Below safety stock
        } else if (currentStock < reorderPoint) {
            stockoutProbability = 60; // Below reorder point
        } else {
            // Standard formula
            stockoutProbability = Math.max(
                Math.min(100 - (daysOfCover / (leadTimeDays * 1.5)) * 100, 100),
                0
            );
        }
    }

    // ─── COMPONENT 2: Demand Variance Score (weight: 30%) ────────────────────
    // demandVarianceScore = Math.min((demandVariance / averageDailyDemand) * 50, 30)
    let demandVarianceScore = 0;
    if (demandForecast.length >= 2 && averageDailyDemand > 0) {
        // Calculate variance from forecast data
        const demands = demandForecast
            .filter((f) => f.actualDemand !== undefined)
            .map((f) => f.actualDemand);

        if (demands.length >= 2) {
            const mean = demands.reduce((a, b) => a + b, 0) / demands.length;
            const variance = demands.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / demands.length;
            const stdDev = Math.sqrt(variance);
            demandVarianceScore = Math.min((stdDev / averageDailyDemand) * 50, 30);
        } else {
            demandVarianceScore = 10; // Default: low variance assumed
            confidence -= 10;
            warnings.push('Insufficient historical demand data for variance calculation');
        }
    } else {
        demandVarianceScore = 10; // Default
        confidence -= 10;
        warnings.push('Demand forecast data unavailable');
    }

    // ─── COMPONENT 3: Supplier Risk Adjustment (weight: 20%) ─────────────────
    // supplierRiskAdjustment = supplierRiskScore * 0.20
    const supplierRiskAdjustment = supplierRiskScore * 0.20;

    // ─── OVERALL SCORE (weighted sum) ─────────────────────────────────────────
    const overallScore = Math.round(
        (stockoutProbability * 0.50) +
        (demandVarianceScore * 0.30) +
        (supplierRiskAdjustment * 0.20)
    );

    confidence = Math.max(0, Math.min(100, confidence));
    const lowConfidence = confidence < 60;

    const riskTier = classifyInventoryRiskTier(overallScore, thresholds);

    return {
        overallScore: Math.min(100, overallScore),
        riskTier,
        components: {
            stockoutProbability: Math.round(stockoutProbability),
            demandVarianceScore: Math.round(demandVarianceScore),
            supplierRiskAdjustment: Math.round(supplierRiskAdjustment),
        },
        confidence,
        lowConfidence,
        confidenceWarning: warnings.length > 0 ? warnings.join('; ') : null,
        scoreType: 'inventoryRisk',
    };
};

const classifyInventoryRiskTier = (score, thresholds) => {
    if (score > thresholds.high) return RISK_TIERS.CRITICAL;
    if (score > thresholds.medium) return RISK_TIERS.HIGH;
    if (score > thresholds.low) return RISK_TIERS.MEDIUM;
    return RISK_TIERS.LOW;
};

module.exports = { calculateInventoryRisk, classifyInventoryRiskTier };
