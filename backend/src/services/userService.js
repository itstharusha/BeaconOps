// FILE: src/services/userService.js
// SPEC REFERENCE: Section 4 - RBAC, Section 17 - Security (User Management)
// Admin-facing service for managing users (create, update, delete, role assignment)

const userRepository = require('../repositories/userRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { hashPassword } = require('../utils/encryption');
const { ERROR_CODES, ROLES } = require('../utils/constants');
const { logger } = require('../utils/logger');

const getAll = async (req, query) => {
    return userRepository.findAll(req.organizationId, query);
};

const getById = async (id, req) => {
    const user = await userRepository.findById(id);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    // Enforce org isolation
    if (user.organizationId?.toString() !== req.organizationId.toString() && req.user.role !== ROLES.SUPER_ADMIN) {
        const err = new Error('User not found in organization');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    return user;
};

/**
 * Create user (Admin function)
 */
const create = async (data, req) => {
    // Check permission
    if (req.user.role !== ROLES.ORG_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
        const err = new Error('Insufficient permissions');
        err.statusCode = 403;
        err.errorCode = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
        throw err;
    }

    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
        const err = new Error('Email already registered');
        err.statusCode = 409;
        err.errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
        throw err;
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await userRepository.create({
        ...data,
        password: hashedPassword,
        organizationId: req.organizationId,
    });

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'user.created_admin',
        entityType: 'user',
        entityId: user._id,
        metadata: { createdBy: req.user.email },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return { userId: user._id, email: user.email, role: user.role };
};

const update = async (id, data, req) => {
    // Check permission (Admin or Self)
    if (
        req.user.role !== ROLES.ORG_ADMIN &&
        req.user.role !== ROLES.SUPER_ADMIN &&
        req.user.userId !== id
    ) {
        const err = new Error('Insufficient permissions');
        err.statusCode = 403;
        err.errorCode = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
        throw err;
    }

    const user = await userRepository.findById(id);
    if (!user || (user.organizationId?.toString() !== req.organizationId.toString() && req.user.role !== ROLES.SUPER_ADMIN)) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    // Prevent role escalation by self
    if (data.role && req.user.userId === id && req.user.role !== ROLES.SUPER_ADMIN) {
        delete data.role; // Cannot change own role
    }

    // Hash password if updating
    if (data.password) {
        data.password = await hashPassword(data.password);
    }

    const updated = await userRepository.update(id, data);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'user.updated',
        entityType: 'user',
        entityId: id,
        changes: { after: { role: data.role, isActive: data.isActive } },
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return updated;
};

const remove = async (id, req) => {
    if (req.user.role !== ROLES.ORG_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
        const err = new Error('Insufficient permissions');
        err.statusCode = 403;
        err.errorCode = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
        throw err;
    }

    const user = await userRepository.findById(id);
    if (!user || (user.organizationId?.toString() !== req.organizationId.toString() && req.user.role !== ROLES.SUPER_ADMIN)) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }

    await userRepository.softDelete(id);

    await createLog({
        organizationId: req.organizationId,
        userId: req.user.userId,
        action: 'user.deleted',
        entityType: 'user',
        entityId: id,
        status: 'success',
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));
};

module.exports = { getAll, getById, create, update, remove };
