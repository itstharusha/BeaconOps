// FILE: src/agents/supplierRiskAgent.js
// SPEC REFERENCE: Section 9 - AI Agent Architecture, Section 10 - Supplier Risk Scoring
// Runs every 240 minutes (4 hours). Evaluates all active suppliers per org.

const supplierRepository = require('../repositories/supplierRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { calculateSupplierRisk } = require('./scoringEngine/supplierScoring');
const { dispatchAlert, getSeverityFromRiskTier } = require('./alertDispatcher');
const { ALERT_TYPES, RISK_TIERS } = require('../utils/constants');
const { logger } = require('../utils/logger');
const Organization = require('../models/Organization');
const OrganizationConfig = require('../models/OrganizationConfig');

/**
 * Run supplier risk evaluation for all organizations (or a specific one)
 * Spec §9: Agent evaluates all active suppliers, updates risk scores, dispatches alerts
 */
const runSupplierRiskEvaluation = async (targetOrgId = null) => {
    const agentName = 'supplierRiskAgent';
    logger.info(`${agentName}: Starting evaluation`, { targetOrgId });

    let processed = 0;
    let alertsGenerated = 0;
    let errors = 0;

    try {
        // Get organizations to process
        const orgs = targetOrgId
            ? [{ _id: targetOrgId }]
            : await Organization.find({ isActive: true, deletedAt: null }).select('_id').lean();

        for (const org of orgs) {
            const orgId = org._id;

            try {
                // Load org-specific thresholds
                const orgConfig = await OrganizationConfig.findOne({ organizationId: orgId }).lean();
                const thresholds = orgConfig?.riskThresholds?.supplier;

                // Get all active suppliers for this org
                const suppliers = await supplierRepository.findActive(orgId);

                for (const supplier of suppliers) {
                    try {
                        // ─── SCORE ────────────────────────────────────────────────────
                        const scoreResult = calculateSupplierRisk(supplier, thresholds);

                        // ─── UPSERT RISK SCORE ────────────────────────────────────────
                        const savedScore = await riskScoreRepository.upsertScore(
                            orgId,
                            supplier._id,
                            'supplier',
                            {
                                scoreType: 'supplierRisk',
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

                        // ─── DISPATCH ALERT if high/critical risk ─────────────────────
                        if (scoreResult.riskTier === RISK_TIERS.HIGH || scoreResult.riskTier === RISK_TIERS.CRITICAL) {
                            const alert = await dispatchAlert({
                                organizationId: orgId,
                                alertType: ALERT_TYPES.SUPPLIER_RISK,
                                severity: getSeverityFromRiskTier(scoreResult.riskTier),
                                title: `Supplier Risk Alert: ${supplier.name} (${scoreResult.riskTier.toUpperCase()})`,
                                description: `Supplier "${supplier.name}" (${supplier.supplierCode}) has a risk score of ${scoreResult.overallScore}/100. ${scoreResult.confidenceWarning || ''}`,
                                relatedEntityType: 'supplier',
                                relatedEntityId: supplier._id,
                                riskScoreId: savedScore?._id,
                                scoreComponents: scoreResult.components,
                            });

                            if (alert) alertsGenerated++;
                        }

                        processed++;
                    } catch (supplierErr) {
                        errors++;
                        logger.error(`${agentName}: Error processing supplier`, {
                            supplierId: supplier._id,
                            error: supplierErr.message,
                        });
                    }
                }
            } catch (orgErr) {
                errors++;
                logger.error(`${agentName}: Error processing organization`, {
                    orgId,
                    error: orgErr.message,
                });
            }
        }

        logger.info(`${agentName}: Evaluation complete`, { processed, alertsGenerated, errors });
        return { processed, alertsGenerated, errors };
    } catch (err) {
        logger.error(`${agentName}: Fatal error`, { error: err.message });
        throw err;
    }
};

module.exports = { runSupplierRiskEvaluation };
