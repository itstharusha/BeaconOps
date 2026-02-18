// FILE: src/services/shipmentService.js
// SPEC REFERENCE: Section 7 - Shipment Tracking Use Cases, Section 11 - Shipment State Machine

const shipmentRepository = require('../repositories/shipmentRepository');
const supplierRepository = require('../repositories/supplierRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { ERROR_CODES, SHIPMENT_STATUSES, VALID_SHIPMENT_TRANSITIONS } = require('../utils/constants');
const { logger } = require('../utils/logger');

const getAll = async (organizationId, query) => {
    return shipmentRepository.findAll(organizationId, query);
};

const getById = async (id, req) => {
    const shipment = await shipmentRepository.findById(id, req.organizationId);
    if (!shipment) {
        const err = new Error('Shipment not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    const riskScore = await riskScoreRepository.getByEntityId(id, 'shipment', req.organizationId);
    return { ...shipment, riskScore: riskScore || null };
};

const create = async (data, req) => {
    // Verify supplier belongs to org
    const supplier = await supplierRepository.findById(data.supplierId, req.organizationId);
    if (!supplier) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    // Check for duplicate shipmentNumber within org
    const existing = await shipmentRepository.findAll(req.organizationId, { search: data.shipmentNumber });
    if (existing.data.some((s) => s.shipmentNumber === data.shipmentNumber.toUpperCase())) {
        const err = new Error(`Shipment number '${data.shipmentNumber}' already exists`);
        err.statusCode = 409;
        err.errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
        throw err;
    }

    const shipment = await shipmentRepository.create({
        ...data,
        organizationId: req.organizationId,
        status: SHIPMENT_STATUSES.REGISTERED,
    });

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'shipment.created',
        entityType: 'shipment',
        entityId: shipment._id,
        changes: { after: { shipmentNumber: shipment.shipmentNumber, supplierId: shipment.supplierId } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return shipment;
};

const update = async (id, data, req) => {
    const existing = await shipmentRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Shipment not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const updated = await shipmentRepository.update(id, req.organizationId, data);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'shipment.updated',
        entityType: 'shipment',
        entityId: id,
        changes: { before: existing, after: data },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

/**
 * Update shipment status with state machine validation
 * Spec §11: Only valid transitions allowed
 */
const updateStatus = async (id, newStatus, additionalData, req) => {
    const existing = await shipmentRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Shipment not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const validTransitions = VALID_SHIPMENT_TRANSITIONS[existing.status] || [];
    if (!validTransitions.includes(newStatus)) {
        const err = new Error(
            `Invalid status transition from '${existing.status}' to '${newStatus}'. Valid transitions: ${validTransitions.join(', ')}`
        );
        err.statusCode = 422;
        err.errorCode = ERROR_CODES.BUSINESS_RULE_VIOLATION;
        throw err;
    }

    const updated = await shipmentRepository.updateStatus(
        id,
        req.organizationId,
        newStatus,
        additionalData,
        existing.version
    );

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'shipment.status_changed',
        entityType: 'shipment',
        entityId: id,
        changes: { before: { status: existing.status }, after: { status: newStatus } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

const addTrackingEvent = async (id, event, req) => {
    const existing = await shipmentRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Shipment not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    return shipmentRepository.addTrackingEvent(id, req.organizationId, {
        ...event,
        timestamp: event.timestamp || new Date(),
        source: event.source || 'manual',
    });
};

const remove = async (id, req) => {
    const existing = await shipmentRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Shipment not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    await shipmentRepository.softDelete(id, req.organizationId);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'shipment.deleted',
        entityType: 'shipment',
        entityId: id,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));
};

const getRiskHistory = async (id, req) => {
    const shipment = await shipmentRepository.findById(id, req.organizationId);
    if (!shipment) {
        const err = new Error('Shipment not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    return riskScoreRepository.getHistory(id, 'shipment', req.organizationId);
};

module.exports = { getAll, getById, create, update, updateStatus, addTrackingEvent, remove, getRiskHistory };
