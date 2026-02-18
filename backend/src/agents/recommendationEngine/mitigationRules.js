// FILE: src/agents/recommendationEngine/mitigationRules.js
// SPEC REFERENCE: Section 9 - Recommendation Engine, Decision Logic

const { ALERT_TYPES, RISK_TIERS } = require('../../utils/constants');

/**
 * Generate prioritized mitigation recommendations based on entity type, risk tier, and components
 * Spec §9: Rule-based, deterministic recommendations. No ML.
 */

const SUPPLIER_RECOMMENDATIONS = {
    [RISK_TIERS.CRITICAL]: [
        { priority: 'critical', action: 'Immediately activate backup supplier for all critical orders', rationale: 'Supplier at critical risk level — primary supply chain at risk' },
        { priority: 'critical', action: 'Escalate to procurement director for emergency sourcing', rationale: 'Critical risk requires executive-level intervention' },
        { priority: 'high', action: 'Freeze new purchase orders until risk is resolved', rationale: 'Prevent further exposure to high-risk supplier' },
        { priority: 'high', action: 'Request financial guarantees or letters of credit', rationale: 'Financial instability detected' },
        { priority: 'medium', action: 'Initiate supplier audit and performance review', rationale: 'Document risk factors for compliance' },
    ],
    [RISK_TIERS.HIGH]: [
        { priority: 'high', action: 'Allocate critical orders to backup supplier', rationale: 'High delay rate detected — diversify supply' },
        { priority: 'high', action: 'Request financial guarantees or letters of credit', rationale: 'Financial stability concerns identified' },
        { priority: 'medium', action: 'Increase safety stock for products from this supplier', rationale: 'Buffer against potential supply disruption' },
        { priority: 'medium', action: 'Schedule performance review meeting with supplier', rationale: 'Address quality and delivery issues' },
        { priority: 'low', action: 'Identify and qualify alternative suppliers', rationale: 'Reduce single-supplier dependency' },
    ],
    [RISK_TIERS.MEDIUM]: [
        { priority: 'medium', action: 'Monitor supplier performance closely for next 30 days', rationale: 'Medium risk — trend monitoring required' },
        { priority: 'medium', action: 'Review and update lead time buffers', rationale: 'Account for potential delays' },
        { priority: 'low', action: 'Request updated financial stability report', rationale: 'Ensure financial data is current' },
    ],
    [RISK_TIERS.LOW]: [
        { priority: 'low', action: 'Continue standard monitoring schedule', rationale: 'Supplier performing within acceptable parameters' },
    ],
};

const SHIPMENT_RECOMMENDATIONS = {
    [RISK_TIERS.CRITICAL]: [
        { priority: 'critical', action: 'Contact carrier immediately for shipment status update', rationale: 'Critical delay detected — immediate action required' },
        { priority: 'critical', action: 'Notify receiving team and adjust production schedule', rationale: 'Downstream operations at risk' },
        { priority: 'high', action: 'Explore expedited shipping alternatives', rationale: 'Consider air freight to recover delay' },
        { priority: 'high', action: 'Activate contingency inventory from safety stock', rationale: 'Prevent production stoppage' },
        { priority: 'medium', action: 'File delay claim with carrier if applicable', rationale: 'Recover costs from SLA breach' },
    ],
    [RISK_TIERS.HIGH]: [
        { priority: 'high', action: 'Contact carrier for updated ETA and delay reason', rationale: 'High delay risk — proactive communication needed' },
        { priority: 'high', action: 'Alert downstream stakeholders of potential delay', rationale: 'Allow time for contingency planning' },
        { priority: 'medium', action: 'Review weather and route conditions', rationale: 'Assess if rerouting is feasible' },
        { priority: 'medium', action: 'Check safety stock levels for affected products', rationale: 'Ensure buffer stock is adequate' },
    ],
    [RISK_TIERS.MEDIUM]: [
        { priority: 'medium', action: 'Monitor shipment tracking closely', rationale: 'Medium risk — increased monitoring recommended' },
        { priority: 'low', action: 'Verify carrier contact information is current', rationale: 'Ensure rapid communication if issues arise' },
    ],
    [RISK_TIERS.LOW]: [
        { priority: 'low', action: 'Continue standard shipment monitoring', rationale: 'Shipment on track' },
    ],
};

const INVENTORY_RECOMMENDATIONS = {
    [RISK_TIERS.CRITICAL]: [
        { priority: 'critical', action: 'Place emergency replenishment order immediately', rationale: 'Stock critically low — stockout imminent' },
        { priority: 'critical', action: 'Activate safety stock and notify operations team', rationale: 'Prevent production or fulfillment stoppage' },
        { priority: 'high', action: 'Contact supplier for expedited delivery', rationale: 'Standard lead time insufficient' },
        { priority: 'high', action: 'Identify alternative suppliers for emergency sourcing', rationale: 'Primary supplier may not meet timeline' },
        { priority: 'medium', action: 'Review demand forecast and adjust reorder point', rationale: 'Prevent recurrence of stockout risk' },
    ],
    [RISK_TIERS.HIGH]: [
        { priority: 'high', action: 'Initiate replenishment order — stock below reorder point', rationale: 'Reorder point breached' },
        { priority: 'high', action: 'Review and increase safety stock level', rationale: 'Current buffer insufficient for demand variability' },
        { priority: 'medium', action: 'Assess demand forecast accuracy', rationale: 'High variance detected in demand patterns' },
        { priority: 'medium', action: 'Coordinate with supplier on delivery schedule', rationale: 'Align supply with demand forecast' },
    ],
    [RISK_TIERS.MEDIUM]: [
        { priority: 'medium', action: 'Monitor stock levels daily', rationale: 'Approaching reorder point' },
        { priority: 'low', action: 'Review demand forecast for next 30 days', rationale: 'Ensure replenishment timing is accurate' },
    ],
    [RISK_TIERS.LOW]: [
        { priority: 'low', action: 'Continue standard inventory monitoring', rationale: 'Stock levels adequate' },
    ],
};

/**
 * Get recommendations for an entity based on type and risk tier
 * @param {string} entityType - 'supplier' | 'shipment' | 'inventory'
 * @param {string} riskTier - 'critical' | 'high' | 'medium' | 'low'
 * @param {object} components - Score components for additional context
 * @returns {Array} Prioritized list of recommendations
 */
const getRecommendations = (entityType, riskTier, components = {}) => {
    const ruleMap = {
        supplier: SUPPLIER_RECOMMENDATIONS,
        shipment: SHIPMENT_RECOMMENDATIONS,
        inventory: INVENTORY_RECOMMENDATIONS,
    };

    const rules = ruleMap[entityType];
    if (!rules) return [];

    const recommendations = rules[riskTier] || [];

    // Add component-specific recommendations
    if (entityType === 'supplier' && components.geopoliticalScore > 0) {
        recommendations.push({
            priority: 'high',
            action: 'Review geopolitical risk exposure and consider regional diversification',
            rationale: 'Geopolitical risk flag active for supplier region',
        });
    }

    if (entityType === 'shipment' && components.weatherScore >= 30) {
        recommendations.push({
            priority: 'high',
            action: 'Monitor weather conditions along route and prepare for rerouting',
            rationale: 'Severe weather conditions detected on shipment route',
        });
    }

    return recommendations;
};

module.exports = { getRecommendations };
