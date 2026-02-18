// FILE: src/models/OrganizationConfig.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (OrganizationConfig Schema)
// Stores per-org configurable thresholds, escalation rules, notification channels

const mongoose = require('mongoose');
const { DEFAULT_RISK_THRESHOLDS } = require('../utils/constants');

const riskThresholdBandSchema = new mongoose.Schema({
    low: { type: Number, required: true, min: 0, max: 100 },
    medium: { type: Number, required: true, min: 0, max: 100 },
    high: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const escalationRuleSchema = new mongoose.Schema({
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
    level: { type: Number, required: true, min: 0, max: 3 },
    timeoutMinutes: { type: Number, required: true, min: 1 },
    escalateTo: { type: String, required: true }, // role name
}, { _id: false });

const notificationChannelSchema = new mongoose.Schema({
    email: {
        enabled: { type: Boolean, default: true },
        recipients: [{ type: String }],
    },
    sms: {
        enabled: { type: Boolean, default: false },
        recipients: [{ type: String }],
    },
    inApp: {
        enabled: { type: Boolean, default: true },
    },
}, { _id: false });

const agentScheduleSchema = new mongoose.Schema({
    supplierRiskEnabled: { type: Boolean, default: true },
    shipmentRiskEnabled: { type: Boolean, default: true },
    inventoryRiskEnabled: { type: Boolean, default: true },
    alertEscalationEnabled: { type: Boolean, default: true },
}, { _id: false });

const lastAgentRunSchema = new mongoose.Schema({
    supplierRisk: { type: Date },
    shipmentRisk: { type: Date },
    inventoryRisk: { type: Date },
    alertEscalation: { type: Date },
}, { _id: false });

const organizationConfigSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
        unique: true,
    },
    riskThresholds: {
        supplier: { type: riskThresholdBandSchema, default: () => DEFAULT_RISK_THRESHOLDS.supplier },
        shipment: { type: riskThresholdBandSchema, default: () => DEFAULT_RISK_THRESHOLDS.shipment },
        inventory: { type: riskThresholdBandSchema, default: () => DEFAULT_RISK_THRESHOLDS.inventory },
    },
    alertEscalationRules: {
        type: [escalationRuleSchema],
        default: [
            // Critical: 15min → 30min → 60min
            { severity: 'critical', level: 0, timeoutMinutes: 15, escalateTo: 'riskAnalyst' },
            { severity: 'critical', level: 1, timeoutMinutes: 30, escalateTo: 'orgAdmin' },
            { severity: 'critical', level: 2, timeoutMinutes: 60, escalateTo: 'superAdmin' },
            // High: 30min → 60min → 120min
            { severity: 'high', level: 0, timeoutMinutes: 30, escalateTo: 'riskAnalyst' },
            { severity: 'high', level: 1, timeoutMinutes: 60, escalateTo: 'orgAdmin' },
            { severity: 'high', level: 2, timeoutMinutes: 120, escalateTo: 'superAdmin' },
        ],
    },
    notificationChannels: { type: notificationChannelSchema, default: () => ({}) },
    agentSchedule: { type: agentScheduleSchema, default: () => ({}) },
    lastAgentRun: { type: lastAgentRunSchema, default: () => ({}) },
    // Alert cooldown overrides (in ms)
    alertCooldowns: {
        supplierRisk: { type: Number, default: 4 * 60 * 60 * 1000 },
        shipmentDelay: { type: Number, default: 60 * 60 * 1000 },
        inventoryStockout: { type: Number, default: 2 * 60 * 60 * 1000 },
    },
}, {
    timestamps: true,
});

// ─── PRE-SAVE: Validate threshold bands don't overlap ─────────────────────────
organizationConfigSchema.pre('save', function (next) {
    const validateBand = (band, name) => {
        if (band.low >= band.medium || band.medium >= band.high) {
            return next(new Error(`${name} thresholds must be in ascending order: low < medium < high`));
        }
    };
    if (this.riskThresholds) {
        validateBand(this.riskThresholds.supplier, 'Supplier');
        validateBand(this.riskThresholds.shipment, 'Shipment');
        validateBand(this.riskThresholds.inventory, 'Inventory');
    }
    next();
});

const OrganizationConfig = mongoose.model('OrganizationConfig', organizationConfigSchema);
module.exports = OrganizationConfig;
