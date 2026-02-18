// FILE: src/models/Inventory.js
// SPEC REFERENCE: Section 5 - MongoDB Data Model (Inventory Schema), Section 16 - Index Requirements

const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
    period: { type: String, required: true }, // e.g., '2024-06'
    forecastedDemand: { type: Number, required: true, min: 0 },
    actualDemand: { type: Number, min: 0 },
    variance: { type: Number },
}, { _id: false });

const inventorySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        trim: true,
        uppercase: true,
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    category: { type: String, trim: true },
    currentStock: {
        type: Number,
        required: [true, 'Current stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0,
    },
    reorderPoint: {
        type: Number,
        required: [true, 'Reorder point is required'],
        min: [0, 'Reorder point cannot be negative'],
    },
    safetyStock: {
        type: Number,
        required: [true, 'Safety stock is required'],
        min: [0, 'Safety stock cannot be negative'],
    },
    leadTimeDays: {
        type: Number,
        required: [true, 'Lead time is required'],
        min: [1, 'Lead time must be at least 1 day'],
    },
    averageDailyDemand: {
        type: Number,
        required: [true, 'Average daily demand is required'],
        min: [0, 'Average daily demand cannot be negative'],
    },
    demandForecast: { type: [demandForecastSchema], default: [] },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    unitCost: { type: Number, min: 0 },
    lastRestocked: { type: Date },
    // Computed field: updated whenever stock or demand changes
    daysOfCover: {
        type: Number,
        min: 0,
        default: 0,
    },
    status: {
        type: String,
        enum: ['adequate', 'low', 'critical', 'outOfStock'],
        default: 'adequate',
    },
    version: { type: Number, default: 0 }, // Optimistic locking
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

// ─── INDEXES (Spec §16) ───────────────────────────────────────────────────────
inventorySchema.index({ organizationId: 1 });
inventorySchema.index({ organizationId: 1, sku: 1 }, { unique: true });
inventorySchema.index({ organizationId: 1, status: 1 });
inventorySchema.index({ supplierId: 1 });

// ─── PRE-SAVE: Compute daysOfCover and status ─────────────────────────────────
inventorySchema.pre('save', function (next) {
    // Compute daysOfCover
    if (this.averageDailyDemand > 0) {
        this.daysOfCover = this.currentStock / this.averageDailyDemand;
    } else {
        this.daysOfCover = this.currentStock > 0 ? 999 : 0;
    }

    // Update status based on stock levels
    if (this.currentStock <= 0) {
        this.status = 'outOfStock';
    } else if (this.currentStock <= this.safetyStock) {
        this.status = 'critical';
    } else if (this.currentStock <= this.reorderPoint) {
        this.status = 'low';
    } else {
        this.status = 'adequate';
    }

    // Prevent negative stock
    if (this.currentStock < 0) {
        return next(new Error('Stock cannot be negative'));
    }

    if (this.isModified() && !this.isNew) {
        this.version += 1;
    }

    next();
});

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────
inventorySchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
