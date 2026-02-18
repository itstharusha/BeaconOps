// FILE: src/middlewares/errorHandler.js
// SPEC REFERENCE: Section 13 - Error Format Standard, Standard HTTP Status Codes

const { ERROR_CODES } = require('../utils/constants');
const { logger } = require('../utils/logger');

/**
 * Centralized error handling middleware
 * Must be registered LAST in Express middleware chain
 * Returns spec §13 error format: { success, message, errorCode, errors, timestamp, path, method }
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Unhandled error', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
        organizationId: req.user?.organizationId,
    });

    // Determine status code
    let statusCode = err.statusCode || 500;
    let errorCode = err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR;
    let message = err.message || 'An unexpected error occurred';
    let errors = err.errors || [];

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = ERROR_CODES.VALIDATION_ERROR;
        message = 'Validation failed';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `${field} already exists`;
        errors = [{ field, message: `${field} must be unique` }];
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = ERROR_CODES.VALIDATION_ERROR;
        message = `Invalid ${err.path}: ${err.value}`;
        errors = [{ field: err.path, message: 'Invalid ID format' }];
    }

    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An unexpected error occurred. Please try again later.';
        errors = [];
    }

    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
        errors,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    });
};

/**
 * 404 Not Found handler
 * Register before errorHandler for unmatched routes
 */
const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        errorCode: ERROR_CODES.RESOURCE_NOT_FOUND,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    });
};

module.exports = { errorHandler, notFoundHandler };
