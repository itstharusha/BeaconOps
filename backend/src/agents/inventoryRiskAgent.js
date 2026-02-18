// FILE: src/agents/inventoryRiskAgent.js
// SPEC REFERENCE: Section 9 - AI Agent Architecture, Section 10 - Inventory Risk Scoring
// Runs every 30 minutes. Evaluates all inventory items per org.

const inventoryRepository = require('../repositories/inventoryRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { calculateInventoryRisk } = require('./scoringEngine/inventoryScoring');
const { dispatchAlert, getSeverityFromRiskTier } = require('./alertDispatcher');
const { ALERT_TYPES, RISK_TIERS } = require('../utils/constants');
const { logger } = require('../utils/logger');
const Organization = require('../models/Organization');
const OrganizationConfig = require('../models/OrganizationConfig');

const runInventoryRiskEvaluation = async (targetOrgId = null) => {
    const agentName = 'inventoryRiskAgent';
    logger.info(`${agentName}: Starting evaluation`, { targetOrgId });

    let processed = 0;
    let alertsGenerated = 0;
    let errors = 0;

    try {
        const orgs = targetOrgId
            ? [{ _id: targetOrgId }]
            : await Organization.find({ isActive: true, deletedAt: null }).select('_id').lean();

        for (const org of orgs) {
            const orgId = org._id;

            try {
                const orgConfig = await OrganizationConfig.findOne({ organizationId: orgId }).lean();
                const thresholds = orgConfig?.riskThresholds?.inventory;

                const inventoryItems = await inventoryRepository.findAll_forAgent(orgId);

                for (const item of inventoryItems) {
                    try {
                        // Get supplier risk score for adjustment (Spec §10)
                        let supplierRiskScore = 50; // Default
                        if (item.supplierId) {
                            const supplierScore = await riskScoreRepository.getByEntityId(
                                item.supplierId,
                                'supplier',
                                orgId
                            );
                            if (supplierScore) supplierRiskScore = supplierScore.overallScore;
                        }

                        const scoreResult = calculateInventoryRisk(item, supplierRiskScore, thresholds);

                        const savedScore = await riskScoreRepository.upsertScore(
                            orgId,
                            item._id,
                            'inventory',
                            {
                                scoreType: 'inventoryRisk',
                                overallScore: scoreResult.overallScore,
                                riskTier: scoreResult.riskTier,
                                components: scoreResult.components,
                                confidence: scoreResult.confidence,
                                lowConfidence: scoreResult.lowConfidence,
                                confidenceWarning: scoreResult.confidenceWarning,
                                evaluatedAt: new Date(),
                                evaluatedBy: 'agent',
                            }
                        );

                        if (scoreResult.riskTier === RISK_TIERS.HIGH || scoreResult.riskTier === RISK_TIERS.CRITICAL) {
                            const alertType = item.currentStock <= 0
                                ? ALERT_TYPES.INVENTORY_STOCKOUT
                                : ALERT_TYPES.INVENTORY_LOW;

                            const alert = await dispatchAlert({
                                organizationId: orgId,
                                alertType,
                                severity: getSeverityFromRiskTier(scoreResult.riskTier),
                                title: `Inventory Risk Alert: ${item.productName} (${scoreResult.riskTier.toUpperCase()})`,
                                description: `SKU "${item.sku}" (${item.productName}) has a risk score of ${scoreResult.overallScore}/100. Current stock: ${item.currentStock}, Days of cover: ${item.daysOfCover?.toFixed(1) || 0}. ${scoreResult.confidenceWarning || ''}`,
                                relatedEntityType: 'inventory',
                                relatedEntityId: item._id,
                                riskScoreId: savedScore?._id,
                                scoreComponents: scoreResult.components,
                            });

                            if (alert) alertsGenerated++;
                        }

                        processed++;
                    } catch (itemErr) {
                        errors++;
                        logger.error(`${agentName}: Error processing inventory item`, {
                            itemId: item._id,
                            error: itemErr.message,
                        });
                    }
                }
            } catch (orgErr) {
                errors++;
                logger.error(`${agentName}: Error processing organization`, { orgId, error: orgErr.message });
            }
        }

        logger.info(`${agentName}: Evaluation complete`, { processed, alertsGenerated, errors });
        return { processed, alertsGenerated, errors };
    } catch (err) {
        logger.error(`${agentName}: Fatal error`, { error: err.message });
        throw err;
    }
};

module.exports = { runInventoryRiskEvaluation };
