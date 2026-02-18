// FILE: src/models/Supplier.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (Supplier Schema), Section 16 - Index Requirements

const mongoose = require('mongoose');
const { SUPPLIER_STATUSES, SUPPLIER_CATEGORIES } = require('../utils/constants');

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
}, { _id: false });

const financialStabilitySchema = new mongoose.Schema({
    rating: { type: String, enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D', 'NR'], default: 'NR' },
    score: { type: Number, min: 0, max: 100, default: 50 },
    lastUpdated: { type: Date },
    source: { type: String },
}, { _id: false });

const performanceMetricsSchema = new mongoose.Schema({
    onTimeDeliveryRate: { type: Number, min: 0, max: 100, default: 100 },  // percentage
    defectRate: { type: Number, min: 0, max: 100, default: 0 },            // percentage
    disputeFrequency: { type: Number, min: 0, default: 0 },                // count per year
    averageDelayDays: { type: Number, min: 0, default: 0 },
    totalShipments: { type: Number, default: 0 },
    lastUpdated: { type: Date },
}, { _id: false });

const supplierSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
    },
    supplierCode: {
        type: String,
        required: [true, 'Supplier code is required'],
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9-]{3,20}$/, 'Supplier code must be 3-20 alphanumeric characters'],
    },
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true,
        maxlength: [200, 'Supplier name cannot exceed 200 characters'],
    },
    category: {
        type: String,
        enum: SUPPLIER_CATEGORIES,
        required: [true, 'Category is required'],
    },
    contactPerson: { type: String, trim: true },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: { type: String, trim: true },
    address: { type: addressSchema },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    leadTimeDays: {
        type: Number,
        required: [true, 'Lead time is required'],
        min: [1, 'Lead time must be at least 1 day'],
    },
    financialStability: { type: financialStabilitySchema, default: () => ({}) },
    performanceMetrics: { type: performanceMetricsSchema, default: () => ({}) },
    geopoliticalRiskFlag: { type: Boolean, default: false },
    status: {
        type: String,
        enum: Object.values(SUPPLIER_STATUSES),
        default: SUPPLIER_STATUSES.ACTIVE,
    },
    notes: { type: String, maxlength: 2000 },
    // Risk override (manual override by analyst/admin)
    riskOverride: {
        score: { type: Number, min: 0, max: 100 },
        reason: { type: String },
        overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        overriddenAt: { type: Date },
        expiresAt: { type: Date },
    },
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 0 }, // Optimistic locking
}, {
    timestamps: true,
});

// ─── INDEXES (Spec §16) ───────────────────────────────────────────────────────
supplierSchema.index({ organizationId: 1 });
supplierSchema.index({ organizationId: 1, supplierCode: 1 }, { unique: true });
supplierSchema.index({ organizationId: 1, status: 1 });

// ─── PRE-SAVE HOOKS ───────────────────────────────────────────────────────────
supplierSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.version += 1;
    }
    next();
});

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────
supplierSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
