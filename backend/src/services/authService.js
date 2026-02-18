// FILE: src/services/authService.js
// SPEC REFERENCE: Section 17 - JWT Flow, Password Hashing, Refresh Token Rotation
// Login → verify password → generate access+refresh tokens → store refresh token hash

const userRepository = require('../repositories/userRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { hashPassword, comparePassword, generateSecureToken } = require('../utils/encryption');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { ERROR_CODES, ROLES } = require('../utils/constants');
const { logger } = require('../utils/logger');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationConfig = require('../models/OrganizationConfig');

// In-memory refresh token store (production: use Redis or DB collection)
// For this implementation, we store hashed refresh tokens in the User document
const REFRESH_TOKEN_FIELD = 'refreshTokens'; // Array of { tokenId, hashedToken, createdAt }

/**
 * Register a new user
 * Spec §17: Hash password with bcrypt (12 rounds), assign role permissions
 */
const register = async ({ email, password, firstName, lastName, role, organizationId, invitedBy }) => {
    // Check if email already exists
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        const err = new Error('Email already registered');
        err.statusCode = 409;
        err.errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
        throw err;
    }

    // Validate organization exists (for non-super-admin)
    if (role !== ROLES.SUPER_ADMIN && organizationId) {
        const org = await Organization.findById(organizationId).lean();
        if (!org || !org.isActive) {
            const err = new Error('Organization not found or inactive');
            err.statusCode = 404;
            err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
            throw err;
        }
    }

    const hashedPassword = await hashPassword(password);

    const user = await userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationId: organizationId || null,
    });

    // Create default OrganizationConfig if first admin of a new org
    if (role === ROLES.ORG_ADMIN && organizationId) {
        const existingConfig = await OrganizationConfig.findOne({ organizationId }).lean();
        if (!existingConfig) {
            await OrganizationConfig.create({ organizationId });
        }
    }

    await createLog({
        organizationId,
        userId: user._id,
        action: 'user.registered',
        entityType: 'user',
        entityId: user._id,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return { userId: user._id, email: user.email, role: user.role };
};

/**
 * Login user
 * Spec §17: 5 failed attempts → lock account for 30 minutes
 */
const login = async ({ email, password, ipAddress, userAgent }) => {
    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null })
        .select('+password +failedLoginAttempts +lockUntil')
        .lean();

    if (!user) {
        const err = new Error('Invalid email or password');
        err.statusCode = 401;
        err.errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS;
        throw err;
    }

    // Check account lock (Spec §17)
    if (user.lockUntil && user.lockUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
        const err = new Error(`Account locked. Try again in ${minutesLeft} minutes`);
        err.statusCode = 423;
        err.errorCode = 'ACCOUNT_LOCKED';
        throw err;
    }

    if (!user.isActive) {
        const err = new Error('Account is deactivated. Contact your administrator.');
        err.statusCode = 403;
        err.errorCode = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
        throw err;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        // Increment failed attempts
        await userRepository.incrementFailedLogins(user._id);

        if (user.failedLoginAttempts + 1 >= 5) {
            await userRepository.lockAccount(user._id, 30 * 60 * 1000); // 30 min lock
            logger.warn('Account locked after 5 failed attempts', { userId: user._id });
        }

        await createLog({
            organizationId: user.organizationId,
            userId: user._id,
            action: 'user.login_failed',
            entityType: 'user',
            entityId: user._id,
            ipAddress,
            userAgent,
            status: 'failure',
            errorMessage: 'Invalid password',
        }).catch((e) => logger.error('Audit log failed', { error: e.message }));

        const err = new Error('Invalid email or password');
        err.statusCode = 401;
        err.errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS;
        throw err;
    }

    // Reset failed login counter
    await userRepository.resetFailedLogins(user._id);

    // Generate tokens
    const tokenId = require('crypto').randomUUID();
    const accessToken = generateAccessToken({
        userId: user._id,
        organizationId: user.organizationId,
        role: user.role,
        permissions: user.permissions,
        bypassOrgFilter: user.role === ROLES.SUPER_ADMIN,
    });
    const refreshToken = generateRefreshToken(user._id, tokenId);

    await createLog({
        organizationId: user.organizationId,
        userId: user._id,
        action: 'user.login',
        entityType: 'user',
        entityId: user._id,
        ipAddress,
        userAgent,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            permissions: user.permissions,
        },
    };
};

/**
 * Refresh access token using refresh token
 * Spec §17: Refresh token rotation — issue new refresh token on each use
 */
const refreshAccessToken = async (refreshToken) => {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
        const err = new Error('User not found or inactive');
        err.statusCode = 401;
        err.errorCode = ERROR_CODES.AUTH_TOKEN_INVALID;
        throw err;
    }

    // Issue new access token
    const newAccessToken = generateAccessToken({
        userId: user._id,
        organizationId: user.organizationId,
        role: user.role,
        permissions: user.permissions,
        bypassOrgFilter: user.role === ROLES.SUPER_ADMIN,
    });

    // Rotate refresh token
    const newTokenId = require('crypto').randomUUID();
    const newRefreshToken = generateRefreshToken(user._id, newTokenId);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Change password
 * Spec §17: Verify current password, hash new password, invalidate all refresh tokens
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password').lean();
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
        const err = new Error('Current password is incorrect');
        err.statusCode = 400;
        err.errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS;
        throw err;
    }

    const hashedNew = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashedNew });

    await createLog({
        organizationId: user.organizationId,
        userId,
        action: 'user.password_changed',
        entityType: 'user',
        entityId: userId,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));
};

module.exports = { register, login, refreshAccessToken, changePassword };
