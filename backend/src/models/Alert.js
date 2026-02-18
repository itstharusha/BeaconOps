// FILE: src/models/Alert.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (Alert Schema), Section 16 - Index Requirements
// TTL index: deletedAt (90 days), 5 compound indexes

const mongoose = require('mongoose');
const { ALERT_TYPES, ALERT_STATUSES } = require('../utils/constants');

const escalationHistorySchema = new mongoose.Schema({
    level: { type: Number, required: true },
    escalatedAt: { type: Date, required: true },
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
}, { _id: false });

const notificationSentSchema = new mongoose.Schema({
    channel: { type: String, enum: ['email', 'sms', 'inApp'], required: true },
    sentAt: { type: Date, required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
    action: { type: String, required: true },
    rationale: { type: String },
}, { _id: false });

const alertSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
    },
    alertType: {
        type: String,
        enum: Object.values(ALERT_TYPES),
        required: [true, 'Alert type is required'],
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        required: [true, 'Severity is required'],
    },
    title: {
        type: String,
        required: [true, 'Alert title is required'],
        maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
        type: String,
        required: [true, 'Alert description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    relatedEntityType: {
        type: String,
        enum: ['supplier', 'shipment', 'inventory'],
        required: [true, 'Related entity type is required'],
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Related entity ID is required'],
    },
    riskScoreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RiskScore',
    },
    status: {
        type: String,
        enum: Object.values(ALERT_STATUSES),
        default: ALERT_STATUSES.GENERATED,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    assignedAt: { type: Date },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    resolutionNotes: {
        type: String,
        maxlength: [2000, 'Resolution notes cannot exceed 2000 characters'],
    },
    escalationLevel: { type: Number, default: 0, min: 0, max: 3 },
    escalationHistory: { type: [escalationHistorySchema], default: [] },
    recommendations: { type: [recommendationSchema], default: [] },
    // Cooldown: do not generate duplicate alert until this time passes (Spec §12)
    cooldownUntil: { type: Date },
    notificationsSent: { type: [notificationSentSchema], default: [] },
    version: { type: Number, default: 0 }, // Optimistic locking
    // Soft delete with TTL (Spec §16: archived after 90 days, auto-deleted after 180 days)
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

// ─── INDEXES (Spec §16 - Alert Collection) ────────────────────────────────────
alertSchema.index({ organizationId: 1 });
alertSchema.index({ organizationId: 1, status: 1 });
alertSchema.index({ organizationId: 1, severity: 1 });
alertSchema.index({ assignedTo: 1, status: 1 });
alertSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
alertSchema.index({ createdAt: -1 });
// TTL index: auto-delete 90 days after soft-delete (Spec §16)
alertSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// ─── PRE-SAVE: Optimistic locking ────────────────────────────────────────────
alertSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.version += 1;
    }
    next();
});

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────
alertSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
