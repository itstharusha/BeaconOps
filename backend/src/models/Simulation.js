// FILE: src/models/Simulation.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (Simulation Schema), Section 9 - Simulation Engine

const mongoose = require('mongoose');
const { SIMULATION_TYPES } = require('../utils/constants');

const simulationResultsSchema = new mongoose.Schema({
    impactedShipmentsCount: { type: Number, default: 0 },
    estimatedDelayDays: { type: Number, default: 0 },
    criticalInventoryItems: { type: Number, default: 0 },
    financialImpact: { type: Number, default: 0 },
    impactedShipments: [{ type: mongoose.Schema.Types.Mixed }],
    criticalInventory: [{ type: mongoose.Schema.Types.Mixed }],
    recommendations: [{ type: mongoose.Schema.Types.Mixed }],
    projectedStockLevels: [{ type: mongoose.Schema.Types.Mixed }],
}, { _id: false });

const simulationSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required'],
    },
    simulationType: {
        type: String,
        enum: Object.values(SIMULATION_TYPES),
        required: [true, 'Simulation type is required'],
    },
    title: {
        type: String,
        required: [true, 'Simulation title is required'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, maxlength: 1000 },
    parameters: {
        // Supplier Failure: supplierId, failureDurationDays, affectedSkus
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        failureDurationDays: { type: Number, min: 1 },
        affectedSkus: [{ type: String }],
        // Shipment Delay: shipmentId, additionalDelayDays
        shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
        additionalDelayDays: { type: Number, min: 1 },
        // Demand Spike: skus, demandIncreasePercent, durationDays
        skus: [{ type: String }],
        demandIncreasePercent: { type: Number, min: 1, max: 1000 },
        durationDays: { type: Number, min: 1 },
        // Custom: free-form
        custom: { type: mongoose.Schema.Types.Mixed },
    },
    results: { type: simulationResultsSchema, default: () => ({}) },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending',
    },
    executedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

simulationSchema.index({ organizationId: 1, createdAt: -1 });
simulationSchema.index({ organizationId: 1, simulationType: 1 });

const Simulation = mongoose.model('Simulation', simulationSchema);
module.exports = Simulation;
