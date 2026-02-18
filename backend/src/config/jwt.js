// FILE: src/config/jwt.js
// SPEC REFERENCE: Section 17 - JWT Access + Refresh Flow
// Access token: 15 min, HS256, claims: userId, organizationId, role, permissions
// Refresh token: 7 days, stored in DB, HTTP-only cookie

const jwt = require('jsonwebtoken');
const { ERROR_CODES } = require('../utils/constants');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate JWT access token
 * Spec §17: Claims include userId, organizationId, role, permissions, iat, exp
 */
const generateAccessToken = (payload) => {
    const { userId, organizationId, role, permissions, bypassOrgFilter = false } = payload;
    return jwt.sign(
        { userId, organizationId, role, permissions, bypassOrgFilter },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRY, algorithm: 'HS256' }
    );
};

/**
 * Generate JWT refresh token
 * Spec §17: Claims include userId, tokenId (unique ID for tracking), iat, exp
 */
const generateRefreshToken = (userId, tokenId) => {
    return jwt.sign(
        { userId, tokenId },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY, algorithm: 'HS256' }
    );
};

/**
 * Verify access token
 * Returns decoded payload or throws error with appropriate errorCode
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const err = new Error('Access token expired');
            err.errorCode = ERROR_CODES.AUTH_TOKEN_EXPIRED;
            err.statusCode = 401;
            throw err;
        }
        const err = new Error('Invalid access token');
        err.errorCode = ERROR_CODES.AUTH_TOKEN_INVALID;
        err.statusCode = 401;
        throw err;
    }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const err = new Error('Refresh token expired');
            err.errorCode = ERROR_CODES.AUTH_TOKEN_EXPIRED;
            err.statusCode = 401;
            throw err;
        }
        const err = new Error('Invalid refresh token');
        err.errorCode = ERROR_CODES.AUTH_TOKEN_INVALID;
        err.statusCode = 401;
        throw err;
    }
};

/**
 * Cookie options for refresh token
 * Spec §17: HTTP-only, Secure, SameSite cookie
 */
const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/auth',
});

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getRefreshCookieOptions,
    ACCESS_EXPIRY,
    REFRESH_EXPIRY,
};
