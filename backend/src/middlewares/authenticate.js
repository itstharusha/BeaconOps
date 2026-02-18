// FILE: src/middlewares/authenticate.js
// SPEC REFERENCE: Section 13 - Authentication Requirements Per Route
// Decodes JWT Bearer token, loads user info, attaches to req.user

const { verifyAccessToken } = require('../config/jwt');
const { errorResponse } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Authenticate middleware
 * Validates JWT Bearer token from Authorization header
 * Attaches decoded user info to req.user: { userId, organizationId, role, permissions, bypassOrgFilter }
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 401, 'Authentication token required', ERROR_CODES.AUTH_TOKEN_INVALID);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return errorResponse(res, 401, 'Authentication token required', ERROR_CODES.AUTH_TOKEN_INVALID);
        }

        // Verify token and extract claims
        const decoded = verifyAccessToken(token);

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role,
            permissions: decoded.permissions || [],
            bypassOrgFilter: decoded.bypassOrgFilter || false,
        };

        next();
    } catch (error) {
        return errorResponse(
            res,
            error.statusCode || 401,
            error.message || 'Authentication failed',
            error.errorCode || ERROR_CODES.AUTH_TOKEN_INVALID
        );
    }
};

module.exports = { authenticate };
