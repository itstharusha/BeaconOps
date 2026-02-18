// FILE: src/middlewares/organizationIsolation.js
// SPEC REFERENCE: Section 17 - Cross-Tenant Data Isolation
// Extracts organizationId from JWT, enforces org-scoped data access

const { errorResponse } = require('../utils/apiResponse');
const { ERROR_CODES, ROLES } = require('../utils/constants');

/**
 * Organization isolation middleware
 * Spec §17: Extract organizationId from JWT, attach to req.organizationId
 * Super Admin gets bypassOrgFilter: true flag — can access all organizations
 *
 * This middleware must run AFTER authenticate middleware
 */
const organizationIsolation = (req, res, next) => {
    if (!req.user) {
        return errorResponse(res, 401, 'Authentication required', ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    // Super Admin can bypass org filter (cross-org access)
    if (req.user.role === ROLES.SUPER_ADMIN && req.user.bypassOrgFilter) {
        req.organizationId = null; // null = no org filter applied
        req.isSuperAdmin = true;
        return next();
    }

    if (!req.user.organizationId) {
        return errorResponse(res, 403, 'Organization context required', ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    }

    req.organizationId = req.user.organizationId;
    req.isSuperAdmin = false;
    next();
};

/**
 * Verify that a resource belongs to the requesting user's organization
 * Call this in service layer when fetching a specific resource by ID
 * Spec §17: If resource.organizationId !== user.organizationId → 403 Forbidden
 */
const verifyOrgOwnership = (resourceOrgId, req) => {
    if (req.isSuperAdmin) return true; // Super Admin can access any org
    return resourceOrgId && resourceOrgId.toString() === req.organizationId.toString();
};

module.exports = { organizationIsolation, verifyOrgOwnership };
