// FILE: src/agents/shipmentRiskAgent.js
// SPEC REFERENCE: Section 9 - AI Agent Architecture, Section 10 - Shipment Risk Scoring
// Runs every 15 minutes. Evaluates all active/in-transit shipments.

const shipmentRepository = require('../repositories/shipmentRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { calculateShipmentRisk } = require('./scoringEngine/shipmentScoring');
const { dispatchAlert, getSeverityFromRiskTier } = require('./alertDispatcher');
const { ALERT_TYPES, RISK_TIERS } = require('../utils/constants');
const { logger } = require('../utils/logger');
const Organization = require('../models/Organization');
const OrganizationConfig = require('../models/OrganizationConfig');

const runShipmentRiskEvaluation = async (targetOrgId = null) => {
    const agentName = 'shipmentRiskAgent';
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
                const thresholds = orgConfig?.riskThresholds?.shipment;

                // Evaluate all active shipments (registered, inTransit, delayed, rerouted)
                const shipments = await shipmentRepository.findActive(orgId);

                for (const shipment of shipments) {
                    try {
                        const scoreResult = calculateShipmentRisk(shipment, thresholds);

                        const savedScore = await riskScoreRepository.upsertScore(
                            orgId,
                            shipment._id,
                            'shipment',
                            {
                                scoreType: 'shipmentRisk',
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
                            const alert = await dispatchAlert({
                                organizationId: orgId,
                                alertType: ALERT_TYPES.SHIPMENT_DELAY,
                                severity: getSeverityFromRiskTier(scoreResult.riskTier),
                                title: `Shipment Delay Alert: ${shipment.shipmentNumber} (${scoreResult.riskTier.toUpperCase()})`,
                                description: `Shipment "${shipment.shipmentNumber}" has a risk score of ${scoreResult.overallScore}/100. ETA deviation: ${scoreResult.components.etaDeviationScore}h. ${scoreResult.confidenceWarning || ''}`,
                                relatedEntityType: 'shipment',
                                relatedEntityId: shipment._id,
                                riskScoreId: savedScore?._id,
                                scoreComponents: scoreResult.components,
                            });

                            if (alert) alertsGenerated++;
                        }

                        processed++;
                    } catch (shipmentErr) {
                        errors++;
                        logger.error(`${agentName}: Error processing shipment`, {
                            shipmentId: shipment._id,
                            error: shipmentErr.message,
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

module.exports = { runShipmentRiskEvaluation };
