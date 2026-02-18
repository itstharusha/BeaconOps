// FILE: src/services/auditService.js
// SPEC REFERENCE: Section 17 - Audit Logging (Admin view)
// Retrieve and filter audit logs

const auditLogRepository = require('../repositories/auditLogRepository');
const { ROLES } = require('../utils/constants');

const getLogs = async (req, query) => {
    // Only Admin/Super Admin can view audit logs
    // (Middleware should enforce this, but double check here)
    if (req.user.role !== ROLES.ORG_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
        const err = new Error('Insufficient permissions');
        err.statusCode = 403;
        err.errorCode = 'INSUFFICIENT_PERMISSIONS';
        throw err;
    }

    return auditLogRepository.queryLogs(req.organizationId, query);
};

const getMyLogs = async (req, query) => {
    // Users can see their own activity logs
    query.userId = req.user.userId;
    return auditLogRepository.queryLogs(req.organizationId, query);
};

module.exports = { getLogs, getMyLogs };
