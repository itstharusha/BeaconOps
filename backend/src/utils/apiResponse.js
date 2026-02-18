// FILE: src/utils/apiResponse.js
// SPEC REFERENCE: Section 13 - Error Format Standard, Response Structure

const { PAGINATION } = require('./constants');

/**
 * Send a successful response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 */
const successResponse = (res, statusCode = 200, data = null, message = 'Success') => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
};

/**
 * Send a paginated list response
 * @param {object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} totalCount - Total number of items (for pagination)
 * @param {number} page - Current page
 * @param {number} limit - Page size
 */
const paginatedResponse = (res, data, totalCount, page, limit) => {
    const totalPages = Math.ceil(totalCount / limit);
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            pageSize: parseInt(limit),
        },
    });
};

/**
 * Send an error response matching spec §13 error format
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable error message
 * @param {string} errorCode - Error code constant (e.g., 'VALIDATION_ERROR')
 * @param {Array} errors - Field-specific errors [{field, message}]
 */
const errorResponse = (res, statusCode = 500, message = 'Internal server error', errorCode = 'INTERNAL_SERVER_ERROR', errors = []) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
        errors,
        timestamp: new Date().toISOString(),
        path: res.req ? res.req.path : undefined,
        method: res.req ? res.req.method : undefined,
    });
};

/**
 * Extract pagination params from query string with defaults and max limit enforcement
 */
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
        parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
        PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Extract sort params from query string
 */
const getSortParams = (query, defaultField = 'createdAt', defaultOrder = 'desc') => {
    const sortBy = query.sortBy || defaultField;
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    return { [sortBy]: sortOrder };
};

module.exports = {
    successResponse,
    paginatedResponse,
    errorResponse,
    getPaginationParams,
    getSortParams,
};
