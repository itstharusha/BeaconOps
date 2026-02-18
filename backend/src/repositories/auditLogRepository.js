// FILE: src/repositories/auditLogRepository.js
// SPEC REFERENCE: Section 17 - Audit Logging (append-only, 1 year retention)

const AuditLog = require('../models/AuditLog');
const { getPaginationParams, getSortParams } = require('../utils/apiResponse');

/**
 * Create an audit log entry (append-only)
 * Spec §17: All user actions, permission-sensitive actions, system events, security events
 */
const createLog = async (data) => {
    const log = new AuditLog({
        ...data,
        timestamp: data.timestamp || new Date(),
    });
    return log.save();
};

/**
 * Query audit logs with filters and pagination
 */
const queryLogs = async (organizationId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = getSortParams(query, 'timestamp', 'desc');

    const filter = {};
    if (organizationId) filter.organizationId = organizationId;
    if (query.userId) filter.userId = query.userId;
    if (query.action) filter.action = { $regex: query.action, $options: 'i' };
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.dateFrom || query.dateTo) {
        filter.timestamp = {};
        if (query.dateFrom) filter.timestamp.$gte = new Date(query.dateFrom);
        if (query.dateTo) filter.timestamp.$lte = new Date(query.dateTo);
    }

    const [data, totalCount] = await Promise.all([
        AuditLog.find(filter)
            .populate('userId', 'firstName lastName email role')
            .sort(sort).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

module.exports = { createLog, queryLogs };
