// FILE: src/utils/logger.js
// SPEC REFERENCE: Section 16 - Logging Strategy (structured JSON, PII masking, log levels)

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, printf, colorize, errors } = format;
const path = require('path');

// ─── PII MASKING ─────────────────────────────────────────────────────────────
// Spec §16: Mask email addresses in logs (e.g., u***@example.com)
const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local.charAt(0)}***@${domain}`;
};

// Recursively mask sensitive fields in log metadata
const maskSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const masked = Array.isArray(obj) ? [] : {};
    for (const key of Object.keys(obj)) {
        if (['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'].includes(key)) {
            masked[key] = '[REDACTED]';
        } else if (key === 'email' && typeof obj[key] === 'string') {
            masked[key] = maskEmail(obj[key]);
        } else if (typeof obj[key] === 'object') {
            masked[key] = maskSensitiveData(obj[key]);
        } else {
            masked[key] = obj[key];
        }
    }
    return masked;
};

// ─── LOG FORMAT ───────────────────────────────────────────────────────────────
// Spec §16: Structured JSON format with timestamp, level, service, userId, organizationId, action
const productionFormat = combine(
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
    errors({ stack: true }),
    json()
);

const developmentFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(maskSensitiveData(meta), null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

// ─── TRANSPORT CONFIGURATION ──────────────────────────────────────────────────
const buildTransports = () => {
    const transportList = [];

    if (process.env.NODE_ENV === 'production') {
        // Production: file rotation + error file
        const DailyRotateFile = require('winston-daily-rotate-file');
        transportList.push(
            new DailyRotateFile({
                filename: path.join('logs', 'application-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxFiles: '30d',
                level: 'info',
                format: productionFormat,
            }),
            new DailyRotateFile({
                filename: path.join('logs', 'error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxFiles: '30d',
                level: 'error',
                format: productionFormat,
            })
        );
    } else {
        // Development: console output (pretty-printed)
        transportList.push(new transports.Console({ format: developmentFormat }));
    }

    return transportList;
};

// ─── LOGGER INSTANCE ──────────────────────────────────────────────────────────
const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: buildTransports(),
    // Do not exit on handled exceptions
    exitOnError: false,
});

// ─── STRUCTURED LOG HELPER ────────────────────────────────────────────────────
// Spec §16: Log format includes userId, organizationId, action, resource, resourceId
const structuredLog = (level, message, context = {}) => {
    const safeContext = maskSensitiveData(context);
    logger[level]({
        service: 'backend',
        message,
        ...safeContext,
    });
};

module.exports = {
    logger,
    info: (message, context) => structuredLog('info', message, context),
    warn: (message, context) => structuredLog('warn', message, context),
    error: (message, context) => structuredLog('error', message, context),
    debug: (message, context) => structuredLog('debug', message, context),
    maskEmail,
};
