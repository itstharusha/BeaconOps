// FILE: src/services/alertService.js
// SPEC REFERENCE: Section 9 - Alert Workflow, Section 12 - Alert State Machine
// Alert states: generated → assigned → acknowledged → inReview → resolved | archived

const alertRepository = require('../repositories/alertRepository');
const userRepository = require('../repositories/userRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { ERROR_CODES, ALERT_STATUSES, VALID_ALERT_TRANSITIONS, ROLES } = require('../utils/constants');
const { logger } = require('../utils/logger');

const getAll = async (req, query) => {
    // Viewers only see assigned alerts (Spec §4 RBAC)
    if (req.user.role === ROLES.VIEWER) {
        query.assignedTo = req.user.userId;
    }
    return alertRepository.findAll(req.organizationId, query);
};

const getById = async (id, req) => {
    const alert = await alertRepository.findById(id, req.organizationId);
    if (!alert) {
        const err = new Error('Alert not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    return alert;
};

const getMyAlerts = async (req) => {
    return alertRepository.findAssigned(req.user.userId, req.organizationId);
};

/**
 * Assign alert to a user
 * Spec §9: Only Risk Analyst, Org Admin, Super Admin can assign alerts
 */
const assign = async (id, assigneeId, req) => {
    const alert = await alertRepository.findById(id, req.organizationId);
    if (!alert) {
        const err = new Error('Alert not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    // Validate state transition
    const validTransitions = VALID_ALERT_TRANSITIONS[alert.status] || [];
    if (!validTransitions.includes(ALERT_STATUSES.ASSIGNED)) {
        const err = new Error(`Cannot assign alert in '${alert.status}' status`);
        err.statusCode = 422;
        err.errorCode = ERROR_CODES.BUSINESS_RULE_VIOLATION;
        throw err;
    }

    // Verify assignee exists in org
    const assignee = await userRepository.findById(assigneeId);
    if (!assignee || assignee.organizationId?.toString() !== req.organizationId.toString()) {
        const err = new Error('Assignee not found in organization');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const updated = await alertRepository.update(id, req.organizationId, {
        status: ALERT_STATUSES.ASSIGNED,
        assignedTo: assigneeId,
        assignedAt: new Date(),
    }, alert.version);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'alert.assigned',
        entityType: 'alert',
        entityId: id,
        changes: { before: { status: alert.status }, after: { status: ALERT_STATUSES.ASSIGNED, assignedTo: assigneeId } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

/**
 * Acknowledge alert (assigned user confirms they are working on it)
 */
const acknowledge = async (id, req) => {
    const alert = await alertRepository.findById(id, req.organizationId);
    if (!alert) {
        const err = new Error('Alert not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    // Only the assigned user can acknowledge (or admin)
    if (
        req.user.role !== ROLES.ORG_ADMIN &&
        req.user.role !== ROLES.SUPER_ADMIN &&
        alert.assignedTo?.toString() !== req.user.userId
    ) {
        const err = new Error('Only the assigned user can acknowledge this alert');
        err.statusCode = 403;
        err.errorCode = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
        throw err;
    }

    const validTransitions = VALID_ALERT_TRANSITIONS[alert.status] || [];
    if (!validTransitions.includes(ALERT_STATUSES.ACKNOWLEDGED)) {
        const err = new Error(`Cannot acknowledge alert in '${alert.status}' status`);
        err.statusCode = 422;
        err.errorCode = ERROR_CODES.BUSINESS_RULE_VIOLATION;
        throw err;
    }

    const updated = await alertRepository.update(id, req.organizationId, {
        status: ALERT_STATUSES.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
    }, alert.version);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'alert.acknowledged',
        entityType: 'alert',
        entityId: id,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

/**
 * Resolve alert with resolution notes
 */
const resolve = async (id, resolutionNotes, req) => {
    const alert = await alertRepository.findById(id, req.organizationId);
    if (!alert) {
        const err = new Error('Alert not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const validTransitions = VALID_ALERT_TRANSITIONS[alert.status] || [];
    if (!validTransitions.includes(ALERT_STATUSES.RESOLVED)) {
        const err = new Error(`Cannot resolve alert in '${alert.status}' status`);
        err.statusCode = 422;
        err.errorCode = ERROR_CODES.BUSINESS_RULE_VIOLATION;
        throw err;
    }

    const updated = await alertRepository.update(id, req.organizationId, {
        status: ALERT_STATUSES.RESOLVED,
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || '',
    }, alert.version);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'alert.resolved',
        entityType: 'alert',
        entityId: id,
        metadata: { resolutionNotes },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

module.exports = { getAll, getById, getMyAlerts, assign, acknowledge, resolve };
