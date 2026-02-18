// FILE: src/repositories/supplierRepository.js
// SPEC REFERENCE: Section 5 - Supplier Schema, Section 16 - Index Requirements
// All queries include organizationId filter for data isolation (Spec §17)

const Supplier = require('../models/Supplier');
const { getPaginationParams, getSortParams } = require('../utils/apiResponse');

/**
 * Find all suppliers for an organization with pagination, filtering, and search
 */
const findAll = async (organizationId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = getSortParams(query, 'name', 'asc');

    const filter = { organizationId };

    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { supplierCode: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [data, totalCount] = await Promise.all([
        Supplier.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Supplier.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

/**
 * Find supplier by ID, enforcing org ownership
 */
const findById = async (id, organizationId) => {
    return Supplier.findOne({ _id: id, organizationId }).lean();
};

/**
 * Find supplier by supplierCode within an org
 */
const findByCode = async (supplierCode, organizationId) => {
    return Supplier.findOne({ supplierCode: supplierCode.toUpperCase(), organizationId }).lean();
};

/**
 * Find suppliers by status
 */
const findByStatus = async (organizationId, status) => {
    return Supplier.find({ organizationId, status }).lean();
};

/**
 * Find all active suppliers (for agent processing)
 */
const findActive = async (organizationId = null) => {
    const filter = { status: { $in: ['active', 'underWatch', 'highRisk'] } };
    if (organizationId) filter.organizationId = organizationId;
    return Supplier.find(filter).lean();
};

/**
 * Create a new supplier
 */
const create = async (data) => {
    const supplier = new Supplier(data);
    return supplier.save();
};

/**
 * Update supplier with optimistic locking (Spec §11)
 */
const update = async (id, organizationId, updates, expectedVersion) => {
    const filter = { _id: id, organizationId };
    if (expectedVersion !== undefined) {
        filter.version = expectedVersion;
    }

    const result = await Supplier.findOneAndUpdate(
        filter,
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!result && expectedVersion !== undefined) {
        // Check if document exists at all
        const exists = await Supplier.findOne({ _id: id, organizationId });
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
 * Soft delete supplier
 */
const softDelete = async (id, organizationId) => {
    return Supplier.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );
};

/**
 * Update performance metrics (called after shipment delivered)
 */
const updatePerformanceMetrics = async (id, metrics) => {
    return Supplier.findByIdAndUpdate(
        id,
        { $set: { 'performanceMetrics': metrics, 'performanceMetrics.lastUpdated': new Date() } },
        { new: true }
    );
};

module.exports = {
    findAll,
    findById,
    findByCode,
    findByStatus,
    findActive,
    create,
    update,
    softDelete,
    updatePerformanceMetrics,
};
