// FILE: src/models/User.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (User Schema)

const mongoose = require('mongoose');
const { ROLES, ROLE_PERMISSIONS } = require('../utils/constants');

const notificationPreferencesSchema = new mongoose.Schema({
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },
    alertSeverities: {
        type: [String],
        enum: ['critical', 'high', 'medium', 'low'],
        default: ['critical', 'high'],
    },
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: [255, 'Email cannot exceed 255 characters'],
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, // Never return password in queries by default
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [100, 'First name cannot exceed 100 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [100, 'Last name cannot exceed 100 characters'],
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: [true, 'Role is required'],
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: function () { return this.role !== ROLES.SUPER_ADMIN; },
    },
    permissions: {
        type: [String],
        default: function () {
            return ROLE_PERMISSIONS[this.role] || [];
        },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    timezone: { type: String, default: 'UTC' },
    notificationPreferences: {
        type: notificationPreferencesSchema,
        default: () => ({}),
    },
    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    // Soft delete
    deletedAt: { type: Date, default: null },
    // Failed login tracking (Spec §17)
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ─── INDEXES (Spec §16 Index Requirements) ────────────────────────────────────
userSchema.index({ organizationId: 1 });
userSchema.index({ organizationId: 1, email: 1 });

// ─── VIRTUALS ─────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function () {
    return this.lockUntil && this.lockUntil > new Date();
});

// ─── METHODS ──────────────────────────────────────────────────────────────────
// Recompute permissions when role changes
userSchema.methods.syncPermissions = function () {
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
};

// ─── PRE-SAVE HOOKS ───────────────────────────────────────────────────────────
userSchema.pre('save', function (next) {
    // Sync permissions when role changes
    if (this.isModified('role')) {
        this.permissions = ROLE_PERMISSIONS[this.role] || [];
    }
    next();
});

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────
// Exclude soft-deleted users by default
userSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
