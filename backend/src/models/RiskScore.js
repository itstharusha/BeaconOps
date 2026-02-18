// FILE: src/models/RiskScore.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (RiskScore Schema), Section 16 - Index Requirements

const mongoose = require('mongoose');
const { RISK_TIERS } = require('../utils/constants');

const scoreComponentsSchema = new mongoose.Schema({
    // Supplier components
    delayScore: Number,
    financialScore: Number,
    defectScore: Number,
    disputeScore: Number,
    geopoliticalScore: Number,
    // Shipment components
    etaDeviationScore: Number,
    weatherScore: Number,
    routeScore: Number,
    carrierScore: Number,
    trackingGapScore: Number,
    // Inventory components
    stockoutProbability: Number,
    demandVarianceScore: Number,
    supplierRiskAdjustment: Number,
}, { _id: false });

const scoreHistoryEntrySchema = new mongoose.Schema({
    score: { type: Number, required: true },
    riskTier: { type: String, enum: Object.values(RISK_TIERS) },
    evaluatedAt: { type: Date, required: true },
}, { _id: false });

const riskScoreSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
    },
    entityType: {
        type: String,
        enum: ['supplier', 'shipment', 'inventory'],
        required: [true, 'Entity type is required'],
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Entity ID is required'],
    },
    scoreType: {
        type: String,
        enum: ['supplierRisk', 'shipmentRisk', 'inventoryRisk'],
        required: [true, 'Score type is required'],
    },
    overallScore: {
        type: Number,
        required: [true, 'Overall score is required'],
        min: 0,
        max: 100,
    },
    riskTier: {
        type: String,
        enum: Object.values(RISK_TIERS),
        required: [true, 'Risk tier is required'],
    },
    components: { type: scoreComponentsSchema, default: () => ({}) },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
    },
    lowConfidence: { type: Boolean, default: false },
    confidenceWarning: { type: String }, // e.g., "Calculated with incomplete data"
    evaluatedAt: {
        type: Date,
        required: [true, 'Evaluation timestamp is required'],
        default: Date.now,
    },
    evaluatedBy: {
        type: String,
        enum: ['agent', 'manual', 'system'],
        default: 'agent',
    },
    // Manual override tracking
    isOverridden: { type: Boolean, default: false },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overrideReason: { type: String },
    notes: { type: String, maxlength: 1000 },
    previousScore: { type: Number, min: 0, max: 100 },
    // Keep last 12 months of history (Spec §16: retain current + 1 year)
    scoreHistory: { type: [scoreHistoryEntrySchema], default: [] },
}, {
    timestamps: true,
});

// ─── INDEXES (Spec §16 - RiskScore Collection) ────────────────────────────────
riskScoreSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });
riskScoreSchema.index({ organizationId: 1, riskTier: 1 });
riskScoreSchema.index({ evaluatedAt: -1 });

// ─── PRE-SAVE: Maintain score history ────────────────────────────────────────
riskScoreSchema.pre('save', function (next) {
    if (this.isModified('overallScore') && !this.isNew && this.previousScore !== undefined) {
        // Add to history (cap at 365 entries = 1 year of daily scores)
        this.scoreHistory.push({
            score: this.previousScore,
            riskTier: this.riskTier,
            evaluatedAt: this.updatedAt || new Date(),
        });
        if (this.scoreHistory.length > 365) {
            this.scoreHistory = this.scoreHistory.slice(-365);
        }
    }
    next();
});

const RiskScore = mongoose.model('RiskScore', riskScoreSchema);
module.exports = RiskScore;
