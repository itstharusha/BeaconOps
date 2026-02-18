// FILE: src/models/AuditLog.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (AuditLog Schema), Section 17 - Audit Logging
// TTL index: 1 year retention. Append-only (no updates or deletes except Super Admin)

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        // null for super admin cross-org actions
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        // Examples: 'supplier.created', 'alert.resolved', 'user.role_changed', 'agent.executed'
    },
    entityType: {
        type: String,
        enum: ['user', 'supplier', 'shipment', 'inventory', 'alert', 'riskScore', 'simulation', 'organization', 'agent', 'system'],
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    changes: {
        before: { type: mongoose.Schema.Types.Mixed },
        after: { type: mongoose.Schema.Types.Mixed },
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success',
    },
    errorMessage: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
}, {
    // No timestamps: we use our own timestamp field for immutability
    timestamps: false,
    // Prevent updates (append-only) — enforced at service layer
});

// ─── INDEXES (Spec §16 - AuditLog Collection) ─────────────────────────────────
auditLogSchema.index({ organizationId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
// TTL index: auto-delete after 1 year (Spec §16)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 365 days

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
