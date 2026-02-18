// FILE: src/middlewares/authorize.js
// SPEC REFERENCE: Section 4 - RBAC Permission Matrix, Section 13 - Permission-Based Routes

const { errorResponse } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Authorization middleware factory
 * @param {string|string[]} requiredPermissions - Permission(s) required (e.g., 'suppliers:create')
 * @returns Express middleware that checks if req.user has the required permission(s)
 *
 * Usage: router.post('/', authenticate, authorize('suppliers:create'), supplierController.create)
 */
const authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, 'Authentication required', ERROR_CODES.AUTH_TOKEN_INVALID);
        }

        const userPermissions = req.user.permissions || [];

        // Super Admin bypass: Super Admin has all permissions
        if (req.user.role === 'superAdmin') {
            return next();
        }

        // Flatten in case permissions are passed as array or multiple args
        const required = requiredPermissions.flat();

        // Check if user has AT LEAST ONE of the required permissions
        const hasPermission = required.some((perm) => userPermissions.includes(perm));

        if (!hasPermission) {
            return errorResponse(
                res,
                403,
                'You do not have permission to perform this action',
                ERROR_CODES.INSUFFICIENT_PERMISSIONS
            );
        }

        next();
    };
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Roles that can access this route
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, 'Authentication required', ERROR_CODES.AUTH_TOKEN_INVALID);
        }

        const roles = allowedRoles.flat();

        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                'You do not have permission to access this resource',
                ERROR_CODES.INSUFFICIENT_PERMISSIONS
            );
        }

        next();
    };
};

module.exports = { authorize, authorizeRoles };
