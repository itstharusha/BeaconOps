// FILE: src/models/Organization.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (Organization Schema)

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
}, { _id: false });

const agentConfigSchema = new mongoose.Schema({
    supplierRiskInterval: { type: Number, default: 240 },   // minutes
    shipmentRiskInterval: { type: Number, default: 15 },
    inventoryRiskInterval: { type: Number, default: 30 },
    alertEscalationInterval: { type: Number, default: 5 },
}, { _id: false });

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
        maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    domain: {
        type: String,
        trim: true,
        lowercase: true,
    },
    industry: {
        type: String,
        trim: true,
    },
    address: { type: addressSchema },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    contactPhone: { type: String, trim: true },
    subscriptionTier: {
        type: String,
        enum: ['starter', 'professional', 'enterprise'],
        default: 'starter',
    },
    featureFlags: {
        simulationEnabled: { type: Boolean, default: true },
        advancedAnalyticsEnabled: { type: Boolean, default: false },
        externalIntegrationsEnabled: { type: Boolean, default: false },
    },
    agentConfig: { type: agentConfigSchema, default: () => ({}) },
    userLimit: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

organizationSchema.index({ domain: 1 });

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
