// FILE: src/repositories/shipmentRepository.js
// SPEC REFERENCE: Section 5 - Shipment Schema, Section 11 - Shipment State Machine

const Shipment = require('../models/Shipment');
const { getPaginationParams, getSortParams } = require('../utils/apiResponse');

const findAll = async (organizationId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = getSortParams(query, 'estimatedArrival', 'asc');

    const filter = { organizationId };
    if (query.status) filter.status = query.status;
    if (query.supplierId) filter.supplierId = query.supplierId;
    if (query.carrier) filter.carrier = query.carrier;
    if (query.search) {
        filter.$or = [
            { shipmentNumber: { $regex: query.search, $options: 'i' } },
            { trackingId: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [data, totalCount] = await Promise.all([
        Shipment.find(filter).populate('supplierId', 'name supplierCode').sort(sort).skip(skip).limit(limit).lean(),
        Shipment.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

const findById = async (id, organizationId) => {
    return Shipment.findOne({ _id: id, organizationId })
        .populate('supplierId', 'name supplierCode country')
        .lean();
};

const findActive = async (organizationId = null) => {
    const filter = { status: { $in: ['registered', 'inTransit', 'delayed', 'rerouted'] } };
    if (organizationId) filter.organizationId = organizationId;
    return Shipment.find(filter).lean();
};

const findDelayed = async (organizationId) => {
    const now = new Date();
    return Shipment.find({
        organizationId,
        status: { $in: ['inTransit', 'delayed'] },
        estimatedArrival: { $lt: now },
    }).lean();
};

const findBySupplier = async (supplierId, organizationId) => {
    return Shipment.find({ supplierId, organizationId }).sort({ createdAt: -1 }).lean();
};

const create = async (data) => {
    const shipment = new Shipment(data);
    return shipment.save();
};

/**
 * Update shipment status with optimistic locking (Spec §11)
 * Uses version field to prevent concurrent updates
 */
const updateStatus = async (id, organizationId, newStatus, additionalData = {}, expectedVersion) => {
    const filter = { _id: id, organizationId };
    if (expectedVersion !== undefined) {
        filter.version = expectedVersion;
    }

    const updates = { status: newStatus, ...additionalData };

    const result = await Shipment.findOneAndUpdate(
        filter,
        { $set: updates, $inc: { version: 1 } },
        { new: true, runValidators: true }
    );

    if (!result && expectedVersion !== undefined) {
        const exists = await Shipment.findOne({ _id: id, organizationId });
        if (exists) {
            const err = new Error('Concurrency conflict, please refresh and retry');
            err.statusCode = 409;
            err.errorCode = 'CONCURRENCY_CONFLICT';
            throw err;
        }
    }

    return result;
};

const update = async (id, organizationId, updates) => {
    return Shipment.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: updates },
        { new: true, runValidators: true }
    );
};

const addTrackingEvent = async (id, organizationId, event) => {
    return Shipment.findOneAndUpdate(
        { _id: id, organizationId },
        { $push: { trackingData: event }, $set: { currentLocation: event.location } },
        { new: true }
    );
};

const softDelete = async (id, organizationId) => {
    return Shipment.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );
};

module.exports = {
    findAll,
    findById,
    findActive,
    findDelayed,
    findBySupplier,
    create,
    updateStatus,
    update,
    addTrackingEvent,
    softDelete,
};
