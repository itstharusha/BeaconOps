// FILE: src/repositories/userRepository.js
// SPEC REFERENCE: Section 5 - User Schema, Section 4 - RBAC

const User = require('../models/User');
const { getPaginationParams, getSortParams } = require('../utils/apiResponse');

const findByEmail = async (email, includePassword = false) => {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return query.lean();
};

const findById = async (id) => {
    return User.findById(id).lean();
};

const findAll = async (organizationId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = getSortParams(query, 'firstName', 'asc');

    const filter = {};
    if (organizationId) filter.organizationId = organizationId;
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.search) {
        filter.$or = [
            { firstName: { $regex: query.search, $options: 'i' } },
            { lastName: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [data, totalCount] = await Promise.all([
        User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        User.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

const create = async (data) => {
    const user = new User(data);
    return user.save();
};

const update = async (id, updates) => {
    return User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
};

/**
 * Update user role and recompute permissions
 * Spec §17: User role change invalidates all refresh tokens (force re-login)
 */
const updateRole = async (id, newRole) => {
    const { ROLE_PERMISSIONS } = require('../utils/constants');
    return User.findByIdAndUpdate(
        id,
        { $set: { role: newRole, permissions: ROLE_PERMISSIONS[newRole] || [] } },
        { new: true, runValidators: true }
    ).lean();
};

const deactivate = async (id) => {
    return User.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
};

const softDelete = async (id) => {
    return User.findByIdAndUpdate(
        id,
        { $set: { deletedAt: new Date(), isActive: false } },
        { new: true }
    ).lean();
};

const incrementFailedLogins = async (id) => {
    return User.findByIdAndUpdate(id, { $inc: { failedLoginAttempts: 1 } }, { new: true }).lean();
};

const resetFailedLogins = async (id) => {
    return User.findByIdAndUpdate(
        id,
        { $set: { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() } },
        { new: true }
    ).lean();
};

const lockAccount = async (id, lockDurationMs = 30 * 60 * 1000) => {
    return User.findByIdAndUpdate(
        id,
        { $set: { lockUntil: new Date(Date.now() + lockDurationMs) } },
        { new: true }
    ).lean();
};

const findByOrg = async (organizationId, role = null) => {
    const filter = { organizationId, isActive: true };
    if (role) filter.role = role;
    return User.find(filter).lean();
};

module.exports = {
    findByEmail,
    findById,
    findAll,
    create,
    update,
    updateRole,
    deactivate,
    softDelete,
    incrementFailedLogins,
    resetFailedLogins,
    lockAccount,
    findByOrg,
};
