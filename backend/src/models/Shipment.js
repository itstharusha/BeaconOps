// FILE: src/models/Shipment.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (Shipment Schema), Section 11 - Shipment State Machine

const mongoose = require('mongoose');
const { SHIPMENT_STATUSES, CARRIERS, VALID_SHIPMENT_TRANSITIONS } = require('../utils/constants');

const locationSchema = new mongoose.Schema({
    city: String,
    country: String,
    coordinates: {
        lat: Number,
        lng: Number,
    },
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    location: { type: locationSchema },
    status: { type: String },
    description: { type: String },
    source: { type: String, enum: ['carrier', 'manual', 'agent'], default: 'carrier' },
}, { _id: true });

const shipmentItemSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    productName: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unitValue: { type: Number, min: 0 },
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
    },
    shipmentNumber: {
        type: String,
        required: [true, 'Shipment number is required'],
        trim: true,
        uppercase: true,
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Supplier ID is required'],
    },
    trackingId: { type: String, trim: true },
    carrier: {
        type: String,
        enum: CARRIERS,
        required: [true, 'Carrier is required'],
    },
    origin: { type: locationSchema },
    destination: { type: locationSchema },
    estimatedDeparture: { type: Date },
    estimatedArrival: {
        type: Date,
        required: [true, 'Estimated arrival date is required'],
    },
    actualDeparture: { type: Date },
    actualArrival: { type: Date },
    status: {
        type: String,
        enum: Object.values(SHIPMENT_STATUSES),
        default: SHIPMENT_STATUSES.REGISTERED,
    },
    delayReason: { type: String, maxlength: 500 },
    currentLocation: { type: locationSchema },
    trackingData: { type: [trackingEventSchema], default: [] },
    // Risk signals
    weatherRisk: {
        type: String,
        enum: ['low', 'medium', 'high', 'severe'],
        default: 'low',
    },
    routeRiskIndex: { type: Number, min: 0, max: 100, default: 0 },
    carrierReliability: { type: Number, min: 0, max: 100, default: 80 },
    // Items in shipment
    items: { type: [shipmentItemSchema], default: [] },
    totalValue: { type: Number, min: 0, default: 0 },
    // Optimistic locking (Spec §11)
    version: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

// ─── INDEXES (Spec §16) ───────────────────────────────────────────────────────
shipmentSchema.index({ organizationId: 1 });
shipmentSchema.index({ organizationId: 1, shipmentNumber: 1 }, { unique: true });
shipmentSchema.index({ organizationId: 1, status: 1 });
shipmentSchema.index({ supplierId: 1, status: 1 });
shipmentSchema.index({ estimatedArrival: 1, status: 1 });

// ─── VIRTUAL: isDelayed ───────────────────────────────────────────────────────
shipmentSchema.virtual('isDelayed').get(function () {
    return this.status === SHIPMENT_STATUSES.DELAYED ||
        (this.estimatedArrival && new Date() > this.estimatedArrival && this.status === SHIPMENT_STATUSES.IN_TRANSIT);
});

// ─── PRE-SAVE: State machine validation (Spec §11) ───────────────────────────
shipmentSchema.pre('save', function (next) {
    if (this.isModified('status') && !this.isNew) {
        const previousStatus = this._previousStatus;
        if (previousStatus && previousStatus !== this.status) {
            const validTransitions = VALID_SHIPMENT_TRANSITIONS[previousStatus] || [];
            if (!validTransitions.includes(this.status)) {
                return next(new Error(
                    `Invalid status transition from '${previousStatus}' to '${this.status}'`
                ));
            }
        }
        this.version += 1;
    }
    next();
});

// Track previous status for state machine validation
shipmentSchema.post('init', function () {
    this._previousStatus = this.status;
});

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────
shipmentSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

const Shipment = mongoose.model('Shipment', shipmentSchema);
module.exports = Shipment;
