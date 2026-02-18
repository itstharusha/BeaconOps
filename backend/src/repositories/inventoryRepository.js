// FILE: src/repositories/inventoryRepository.js
// SPEC REFERENCE: Section 5 - Inventory Schema, Section 16 - Index Requirements

const Inventory = require('../models/Inventory');
const { getPaginationParams, getSortParams } = require('../utils/apiResponse');

const findAll = async (organizationId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = getSortParams(query, 'productName', 'asc');

    const filter = { organizationId };
    if (query.status) filter.status = query.status;
    if (query.supplierId) filter.supplierId = query.supplierId;
    if (query.search) {
        filter.$or = [
            { productName: { $regex: query.search, $options: 'i' } },
            { sku: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [data, totalCount] = await Promise.all([
        Inventory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Inventory.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

const findById = async (id, organizationId) => {
    return Inventory.findOne({ _id: id, organizationId }).lean();
};

const findBySKU = async (sku, organizationId) => {
    return Inventory.findOne({ sku: sku.toUpperCase(), organizationId }).lean();
};

const findCritical = async (organizationId) => {
    return Inventory.find({
        organizationId,
        status: { $in: ['critical', 'outOfStock'] },
    }).sort({ daysOfCover: 1 }).lean();
};

const findBySupplier = async (supplierId, organizationId) => {
    return Inventory.find({ supplierId, organizationId }).lean();
};

const findAll_forAgent = async (organizationId = null) => {
    const filter = {};
    if (organizationId) filter.organizationId = organizationId;
    return Inventory.find(filter).lean();
};

const create = async (data) => {
    const item = new Inventory(data);
    return item.save();
};

const update = async (id, organizationId, updates, expectedVersion) => {
    const filter = { _id: id, organizationId };
    if (expectedVersion !== undefined) {
        filter.version = expectedVersion;
    }

    const result = await Inventory.findOneAndUpdate(
        filter,
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!result && expectedVersion !== undefined) {
        const exists = await Inventory.findOne({ _id: id, organizationId });
        if (exists) {
            const err = new Error('Concurrency conflict, please refresh and retry');
            err.statusCode = 409;
            err.errorCode = 'CONCURRENCY_CONFLICT';
            throw err;
        }
    }

    return result;
};

/**
 * Adjust stock level (can be positive or negative)
 * Spec §14: Stock Adjustment: Integer (can be negative for reduction)
 */
const adjustStock = async (id, organizationId, adjustment, expectedVersion) => {
    const filter = { _id: id, organizationId };
    if (expectedVersion !== undefined) filter.version = expectedVersion;

    // Use findOneAndUpdate with $inc to atomically adjust stock
    const result = await Inventory.findOneAndUpdate(
        filter,
        { $inc: { currentStock: adjustment, version: 1 } },
        { new: true, runValidators: true }
    );

    if (result && result.currentStock < 0) {
        // Rollback if stock went negative
        await Inventory.findByIdAndUpdate(id, { $inc: { currentStock: -adjustment, version: -1 } });
        const err = new Error('Insufficient stock for this adjustment');
        err.statusCode = 422;
        err.errorCode = 'BUSINESS_RULE_VIOLATION';
        throw err;
    }

    return result;
};

const softDelete = async (id, organizationId) => {
    return Inventory.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );
};

module.exports = {
    findAll,
    findById,
    findBySKU,
    findCritical,
    findBySupplier,
    findAll_forAgent,
    create,
    update,
    adjustStock,
    softDelete,
};
