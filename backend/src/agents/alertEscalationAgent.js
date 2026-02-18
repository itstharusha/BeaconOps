// FILE: src/agents/alertEscalationAgent.js
// SPEC REFERENCE: Section 12 - Escalation Ladder, Section 9 - Alert Escalation Agent
// Runs every 5 minutes. Escalates unresolved alerts past their timeout.

const alertRepository = require('../repositories/alertRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { ALERT_STATUSES } = require('../utils/constants');
const { diffInMinutes, now } = require('../utils/dateHelpers');
const { logger } = require('../utils/logger');
const Organization = require('../models/Organization');
const OrganizationConfig = require('../models/OrganizationConfig');

/**
 * Default escalation timeouts (minutes) per severity and level
 * Spec §12: Critical: 15→30→60, High: 30→60→120, Medium: 60→120→240, Low: 120→240→480
 */
const DEFAULT_ESCALATION_TIMEOUTS = {
    critical: [15, 30, 60],
    high: [30, 60, 120],
    medium: [60, 120, 240],
    low: [120, 240, 480],
};

const runAlertEscalation = async (targetOrgId = null) => {
    const agentName = 'alertEscalationAgent';
    logger.info(`${agentName}: Starting escalation run`, { targetOrgId });

    let escalated = 0;
    let errors = 0;

    try {
        const orgs = targetOrgId
            ? [{ _id: targetOrgId }]
            : await Organization.find({ isActive: true, deletedAt: null }).select('_id').lean();

        for (const org of orgs) {
            const orgId = org._id;

            try {
                // Load org-specific escalation rules
                const orgConfig = await OrganizationConfig.findOne({ organizationId: orgId }).lean();
                const escalationRules = orgConfig?.alertEscalationRules || [];

                // Find all alerts eligible for escalation
                const alerts = await alertRepository.findForEscalation(orgId);

                for (const alert of alerts) {
                    try {
                        const currentLevel = alert.escalationLevel || 0;
                        if (currentLevel >= 3) continue; // Already at max escalation

                        // Get timeout for this severity and level
                        const timeoutMinutes = getEscalationTimeout(
                            alert.severity,
                            currentLevel,
                            escalationRules
                        );

                        if (!timeoutMinutes) continue;

                        // Check if timeout has elapsed since last assignment/escalation
                        const referenceTime = alert.escalationHistory?.length > 0
                            ? alert.escalationHistory[alert.escalationHistory.length - 1].escalatedAt
                            : alert.assignedAt;

                        if (!referenceTime) continue;

                        const minutesElapsed = diffInMinutes(referenceTime, now());

                        if (minutesElapsed >= timeoutMinutes) {
                            // Escalate
                            const newLevel = currentLevel + 1;
                            const escalationEntry = {
                                level: newLevel,
                                escalatedAt: now(),
                                reason: `Auto-escalated after ${Math.round(minutesElapsed)} minutes at level ${currentLevel}`,
                            };

                            await alertRepository.update(alert._id, orgId, {
                                escalationLevel: newLevel,
                                $push: { escalationHistory: escalationEntry },
                            });

                            escalated++;

                            logger.info(`${agentName}: Alert escalated`, {
                                alertId: alert._id,
                                severity: alert.severity,
                                fromLevel: currentLevel,
                                toLevel: newLevel,
                                minutesElapsed: Math.round(minutesElapsed),
                            });

                            // Audit log
                            await createLog({
                                organizationId: orgId,
                                userId: null,
                                action: 'alert.escalated',
                                entityType: 'alert',
                                entityId: alert._id,
                                metadata: { fromLevel: currentLevel, toLevel: newLevel, severity: alert.severity },
                                status: 'success',
                            }).catch((err) => logger.error('Audit log failed', { error: err.message }));
                        }
                    } catch (alertErr) {
                        errors++;
                        logger.error(`${agentName}: Error escalating alert`, {
                            alertId: alert._id,
                            error: alertErr.message,
                        });
                    }
                }
            } catch (orgErr) {
                errors++;
                logger.error(`${agentName}: Error processing org`, { orgId, error: orgErr.message });
            }
        }

        logger.info(`${agentName}: Escalation run complete`, { escalated, errors });
        return { escalated, errors };
    } catch (err) {
        logger.error(`${agentName}: Fatal error`, { error: err.message });
        throw err;
    }
};

/**
 * Get escalation timeout for a given severity and current level
 * Uses org-specific rules if available, falls back to defaults
 */
const getEscalationTimeout = (severity, currentLevel, orgRules = []) => {
    // Try org-specific rules first
    if (orgRules.length > 0) {
        const rule = orgRules.find((r) => r.severity === severity && r.level === currentLevel);
        if (rule) return rule.timeoutMinutes;
    }

    // Fall back to spec defaults
    const timeouts = DEFAULT_ESCALATION_TIMEOUTS[severity];
    return timeouts ? timeouts[currentLevel] : null;
};

module.exports = { runAlertEscalation };
