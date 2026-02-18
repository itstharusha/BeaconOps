// FILE: src/services/supplierService.js
// SPEC REFERENCE: Section 6 - Supplier Management Use Cases, Section 11 - Supplier State Machine

const supplierRepository = require('../repositories/supplierRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { verifyOrgOwnership } = require('../middlewares/organizationIsolation');
const { ERROR_CODES, SUPPLIER_STATUSES } = require('../utils/constants');
const { logger } = require('../utils/logger');

const getAll = async (organizationId, query) => {
    return supplierRepository.findAll(organizationId, query);
};

const getById = async (id, req) => {
    const supplier = await supplierRepository.findById(id, req.organizationId);
    if (!supplier) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    // Attach latest risk score
    const riskScore = await riskScoreRepository.getByEntityId(id, 'supplier', req.organizationId);
    return { ...supplier, riskScore: riskScore || null };
};

const create = async (data, req) => {
    // Check for duplicate supplierCode within org
    const existing = await supplierRepository.findByCode(data.supplierCode, req.organizationId);
    if (existing) {
        const err = new Error(`Supplier code '${data.supplierCode}' already exists`);
        err.statusCode = 409;
        err.errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
        throw err;
    }

    const supplier = await supplierRepository.create({
        ...data,
        organizationId: req.organizationId,
    });

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'supplier.created',
        entityType: 'supplier',
        entityId: supplier._id,
        changes: { after: { name: supplier.name, supplierCode: supplier.supplierCode } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return supplier;
};

const update = async (id, data, req) => {
    const existing = await supplierRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    // Prevent changing supplierCode to one that already exists
    if (data.supplierCode && data.supplierCode !== existing.supplierCode) {
        const conflict = await supplierRepository.findByCode(data.supplierCode, req.organizationId);
        if (conflict) {
            const err = new Error(`Supplier code '${data.supplierCode}' already exists`);
            err.statusCode = 409;
            err.errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
            throw err;
        }
    }

    const updated = await supplierRepository.update(id, req.organizationId, data, data.version);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'supplier.updated',
        entityType: 'supplier',
        entityId: id,
        changes: { before: existing, after: data },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

/**
 * Update supplier status (state machine)
 * Spec §11: Valid transitions enforced
 */
const updateStatus = async (id, newStatus, req) => {
    const existing = await supplierRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const validStatuses = Object.values(SUPPLIER_STATUSES);
    if (!validStatuses.includes(newStatus)) {
        const err = new Error(`Invalid status: ${newStatus}`);
        err.statusCode = 400;
        err.errorCode = ERROR_CODES.VALIDATION_ERROR;
        throw err;
    }

    const updated = await supplierRepository.update(id, req.organizationId, { status: newStatus });

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'supplier.status_changed',
        entityType: 'supplier',
        entityId: id,
        changes: { before: { status: existing.status }, after: { status: newStatus } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

const remove = async (id, req) => {
    const existing = await supplierRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    await supplierRepository.softDelete(id, req.organizationId);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'supplier.deleted',
        entityType: 'supplier',
        entityId: id,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));
};

const getRiskHistory = async (id, req) => {
    const supplier = await supplierRepository.findById(id, req.organizationId);
    if (!supplier) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    return riskScoreRepository.getHistory(id, 'supplier', req.organizationId);
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getRiskHistory };
