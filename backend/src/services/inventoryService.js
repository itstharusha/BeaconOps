// FILE: src/services/inventoryService.js
// SPEC REFERENCE: Section 8 - Inventory Management Use Cases

const inventoryRepository = require('../repositories/inventoryRepository');
const supplierRepository = require('../repositories/supplierRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { ERROR_CODES } = require('../utils/constants');
const { logger } = require('../utils/logger');

const getAll = async (organizationId, query) => {
    return inventoryRepository.findAll(organizationId, query);
};

const getById = async (id, req) => {
    const item = await inventoryRepository.findById(id, req.organizationId);
    if (!item) {
        const err = new Error('Inventory item not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    const riskScore = await riskScoreRepository.getByEntityId(id, 'inventory', req.organizationId);
    return { ...item, riskScore: riskScore || null };
};

const create = async (data, req) => {
    // Check for duplicate SKU within org
    const existing = await inventoryRepository.findBySKU(data.sku, req.organizationId);
    if (existing) {
        const err = new Error(`SKU '${data.sku}' already exists`);
        err.statusCode = 409;
        err.errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
        throw err;
    }

    // Verify supplier if provided
    if (data.supplierId) {
        const supplier = await supplierRepository.findById(data.supplierId, req.organizationId);
        if (!supplier) {
            const err = new Error('Supplier not found');
            err.statusCode = 404;
            err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
            throw err;
        }
    }

    const item = await inventoryRepository.create({ ...data, organizationId: req.organizationId });

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'inventory.created',
        entityType: 'inventory',
        entityId: item._id,
        changes: { after: { sku: item.sku, productName: item.productName } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return item;
};

const update = async (id, data, req) => {
    const existing = await inventoryRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Inventory item not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const updated = await inventoryRepository.update(id, req.organizationId, data, data.version);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'inventory.updated',
        entityType: 'inventory',
        entityId: id,
        changes: { before: existing, after: data },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

/**
 * Adjust stock level
 * Spec §8: Stock Adjustment — can be positive (restock) or negative (consumption)
 */
const adjustStock = async (id, adjustment, reason, req) => {
    const existing = await inventoryRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Inventory item not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    if (!Number.isInteger(adjustment)) {
        const err = new Error('Stock adjustment must be an integer');
        err.statusCode = 400;
        err.errorCode = ERROR_CODES.VALIDATION_ERROR;
        throw err;
    }

    const updated = await inventoryRepository.adjustStock(id, req.organizationId, adjustment, existing.version);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'inventory.stock_adjusted',
        entityType: 'inventory',
        entityId: id,
        changes: {
            before: { currentStock: existing.currentStock },
            after: { currentStock: updated.currentStock },
        },
        metadata: { adjustment, reason },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

const remove = async (id, req) => {
    const existing = await inventoryRepository.findById(id, req.organizationId);
    if (!existing) {
        const err = new Error('Inventory item not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    await inventoryRepository.softDelete(id, req.organizationId);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'inventory.deleted',
        entityType: 'inventory',
        entityId: id,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));
};

const getRiskHistory = async (id, req) => {
    const item = await inventoryRepository.findById(id, req.organizationId);
    if (!item) {
        const err = new Error('Inventory item not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    return riskScoreRepository.getHistory(id, 'inventory', req.organizationId);
};

module.exports = { getAll, getById, create, update, adjustStock, remove, getRiskHistory };
