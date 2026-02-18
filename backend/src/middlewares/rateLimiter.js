// FILE: src/middlewares/rateLimiter.js
// SPEC REFERENCE: Section 16 - Rate Limiting, Section 13 - Rate Limits Per Route

const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

// ─── RATE LIMIT RESPONSE HANDLER ─────────────────────────────────────────────
const rateLimitHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        errorCode: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 3600),
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    });
};

// ─── GLOBAL RATE LIMIT: 1000 req/hr per user ─────────────────────────────────
// Spec §16: 1000 requests per hour per user (based on userId from JWT)
const globalRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
    keyGenerator: (req) => req.user?.userId || req.ip, // Per user if authenticated, else per IP
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.user?.role === 'superAdmin', // Super Admin exempt
});

// ─── AUTH RATE LIMIT: 5 attempts per 15 min per IP ───────────────────────────
// Spec §16: 5 login attempts per 15 minutes per IP (brute force protection)
const authRateLimiter = rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    keyGenerator: (req) => req.ip,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── REPORT EXPORT RATE LIMIT: 10 exports per hour per user ──────────────────
// Spec §16: 10 exports per hour per user
const exportRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    keyGenerator: (req) => req.user?.userId || req.ip,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── AGENT TRIGGER RATE LIMIT: 5 triggers per hour per user ──────────────────
// Spec §16: Manual Agent Trigger: 5 triggers per hour per user
const agentTriggerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyGenerator: (req) => req.user?.userId || req.ip,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── PUBLIC ROUTES RATE LIMIT: 100 req per 15 min per IP ─────────────────────
// Spec §16: Public Routes: 100 requests per 15 minutes per IP
const publicRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyGenerator: (req) => req.ip,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalRateLimiter,
    authRateLimiter,
    exportRateLimiter,
    agentTriggerRateLimiter,
    publicRateLimiter,
};
