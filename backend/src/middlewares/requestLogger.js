// FILE: src/middlewares/requestLogger.js
// SPEC REFERENCE: Section 16 - Logging Strategy (INFO: User actions, request/response data)

const { logger } = require('../utils/logger');

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, userId, organizationId, and response time
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger[level]({
            service: 'backend',
            message: `${req.method} ${req.originalUrl} ${res.statusCode}`,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.userId,
            organizationId: req.user?.organizationId,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });

    next();
};

module.exports = { requestLogger };
