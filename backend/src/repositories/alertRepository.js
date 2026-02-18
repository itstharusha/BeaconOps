// FILE: src/repositories/alertRepository.js
// SPEC REFERENCE: Section 5 - Alert Schema, Section 12 - Cooldown, Escalation

const Alert = require('../models/Alert');
const { getPaginationParams, getSortParams } = require('../utils/apiResponse');

const findAll = async (organizationId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    // Default sort: severity desc, then createdAt desc (Spec §14)
    const sort = query.sortBy
        ? getSortParams(query, 'createdAt', 'desc')
        : { severity: -1, createdAt: -1 };

    const filter = { organizationId };
    if (query.severity) {
        filter.severity = Array.isArray(query.severity)
            ? { $in: query.severity }
            : query.severity;
    }
    if (query.status) {
        filter.status = Array.isArray(query.status)
            ? { $in: query.status }
            : query.status;
    }
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.alertType) filter.alertType = query.alertType;
    if (query.relatedEntityId) filter.relatedEntityId = query.relatedEntityId;
    if (query.dateFrom || query.dateTo) {
        filter.createdAt = {};
        if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
        if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }
    if (query.search) {
        filter.$or = [
            { title: { $regex: query.search, $options: 'i' } },
            { description: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [data, totalCount] = await Promise.all([
        Alert.find(filter)
            .populate('assignedTo', 'firstName lastName email')
            .sort(sort).skip(skip).limit(limit).lean(),
        Alert.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

const findById = async (id, organizationId) => {
    return Alert.findOne({ _id: id, organizationId })
        .populate('assignedTo', 'firstName lastName email role')
        .populate('riskScoreId')
        .lean();
};

const findAssigned = async (userId, organizationId) => {
    return Alert.find({
        assignedTo: userId,
        organizationId,
        status: { $in: ['assigned', 'acknowledged', 'inReview'] },
    }).sort({ severity: -1, createdAt: -1 }).lean();
};

/**
 * Check if cooldown is active for an entity+alertType combination
 * Spec §12: Do not generate duplicate alert within cooldown period
 */
const checkCooldown = async (organizationId, relatedEntityId, alertType) => {
    const now = new Date();
    return Alert.findOne({
        organizationId,
        relatedEntityId,
        alertType,
        cooldownUntil: { $gt: now },
        status: { $nin: ['resolved', 'archived'] },
    }).lean();
};

/**
 * Find alerts ready for escalation
 * Spec §12: Unresolved alerts past their escalation timeout
 */
const findForEscalation = async (organizationId = null) => {
    const now = new Date();
    const filter = {
        status: { $in: ['assigned', 'acknowledged', 'inReview'] },
        escalationLevel: { $lt: 3 },
        assignedAt: { $lt: now }, // Has been assigned
    };
    if (organizationId) filter.organizationId = organizationId;
    return Alert.find(filter).populate('assignedTo', 'role').lean();
};

const create = async (data) => {
    const alert = new Alert(data);
    return alert.save();
};

/**
 * Update alert with optimistic locking (Spec §11)
 */
const update = async (id, organizationId, updates, expectedVersion) => {
    const filter = { _id: id, organizationId };
    if (expectedVersion !== undefined) filter.version = expectedVersion;

    const result = await Alert.findOneAndUpdate(
        filter,
        { $set: updates, $inc: { version: 1 } },
        { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email');

    if (!result && expectedVersion !== undefined) {
        const exists = await Alert.findOne({ _id: id, organizationId });
        if (exists) {
            const err = new Error('Concurrency conflict, please refresh and retry');
            err.statusCode = 409;
            err.errorCode = 'CONCURRENCY_CONFLICT';
            throw err;
        }
    }

    return result;
};

const softDelete = async (id, organizationId) => {
    return Alert.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );
};

module.exports = {
    findAll,
    findById,
    findAssigned,
    checkCooldown,
    findForEscalation,
    create,
    update,
    softDelete,
};
