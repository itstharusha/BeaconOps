// FILE: src/agents/alertDispatcher.js
// SPEC REFERENCE: Section 12 - Event & Alert Pipeline, Cooldown Rules, Notification Dispatch

const alertRepository = require('../repositories/alertRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { getRecommendations } = require('./recommendationEngine/mitigationRules');
const { ALERT_TYPES, ALERT_STATUSES, COOLDOWN_DURATIONS } = require('../utils/constants');
const { addMs, now } = require('../utils/dateHelpers');
const { logger } = require('../utils/logger');

/**
 * Dispatch an alert with cooldown check and deduplication
 * Spec §12: Check cooldown → create alert → set cooldownUntil → dispatch notifications
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.alertType - ALERT_TYPES constant
 * @param {string} params.severity - 'critical' | 'high' | 'medium' | 'low'
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.relatedEntityType - 'supplier' | 'shipment' | 'inventory'
 * @param {string} params.relatedEntityId
 * @param {string} params.riskScoreId
 * @param {object} params.scoreComponents - For generating recommendations
 * @param {number} params.cooldownMs - Override cooldown duration in ms
 * @returns {object|null} Created alert or null if cooldown active
 */
const dispatchAlert = async (params) => {
    const {
        organizationId,
        alertType,
        severity,
        title,
        description,
        relatedEntityType,
        relatedEntityId,
        riskScoreId,
        scoreComponents = {},
        cooldownMs,
    } = params;

    // ─── STEP 1: Check cooldown (Spec §12) ────────────────────────────────────
    const existingAlert = await alertRepository.checkCooldown(organizationId, relatedEntityId, alertType);
    if (existingAlert) {
        logger.debug('Alert suppressed by cooldown', {
            alertType,
            relatedEntityId,
            cooldownUntil: existingAlert.cooldownUntil,
        });
        return null; // Cooldown active — do not generate duplicate alert
    }

    // ─── STEP 2: Generate recommendations ────────────────────────────────────
    const recommendations = getRecommendations(relatedEntityType, severity, scoreComponents);

    // ─── STEP 3: Calculate cooldown duration ─────────────────────────────────
    const cooldownDuration = cooldownMs || COOLDOWN_DURATIONS[alertType] || COOLDOWN_DURATIONS.DEFAULT;
    const cooldownUntil = addMs(now(), cooldownDuration);

    // ─── STEP 4: Create alert ─────────────────────────────────────────────────
    const alert = await alertRepository.create({
        organizationId,
        alertType,
        severity,
        title,
        description,
        relatedEntityType,
        relatedEntityId,
        riskScoreId,
        status: ALERT_STATUSES.GENERATED,
        recommendations,
        cooldownUntil,
    });

    logger.info('Alert dispatched', {
        alertId: alert._id,
        alertType,
        severity,
        relatedEntityType,
        relatedEntityId,
        organizationId,
    });

    // ─── STEP 5: Audit log ────────────────────────────────────────────────────
    await createLog({
        organizationId,
        userId: null, // System-generated
        action: 'alert.generated',
        entityType: 'alert',
        entityId: alert._id,
        metadata: { alertType, severity, relatedEntityType, relatedEntityId },
        status: 'success',
    }).catch((err) => logger.error('Failed to create audit log for alert', { error: err.message }));

    return alert;
};

/**
 * Determine alert severity based on risk tier
 * Spec §12: critical→critical, high→high, medium→medium, low→low
 */
const getSeverityFromRiskTier = (riskTier) => {
    const map = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    return map[riskTier] || 'medium';
};

module.exports = { dispatchAlert, getSeverityFromRiskTier };
