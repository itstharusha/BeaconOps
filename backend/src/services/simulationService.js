// FILE: src/services/simulationService.js
// SPEC REFERENCE: Section 9 - Simulation Engine (What-If Analysis)
// Rule-based deterministic simulation. No ML. Spec §9: 4 simulation types.

const Simulation = require('../models/Simulation');
const supplierRepository = require('../repositories/supplierRepository');
const shipmentRepository = require('../repositories/shipmentRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { createLog } = require('../repositories/auditLogRepository');
const { ERROR_CODES, SIMULATION_TYPES } = require('../utils/constants');
const { logger } = require('../utils/logger');

const getAll = async (req, query = {}) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { organizationId: req.organizationId, deletedAt: null };
    if (query.simulationType) filter.simulationType = query.simulationType;

    const [data, totalCount] = await Promise.all([
        Simulation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Simulation.countDocuments(filter),
    ]);

    return { data, totalCount, page, limit };
};

const getById = async (id, req) => {
    const sim = await Simulation.findOne({ _id: id, organizationId: req.organizationId, deletedAt: null }).lean();
    if (!sim) {
        const err = new Error('Simulation not found');
        err.statusCode = 404;
        err.errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        throw err;
    }
    return sim;
};

/**
 * Create and run a simulation
 * Spec §9: Simulations are deterministic, rule-based, read-only (no DB mutations)
 */
const runSimulation = async (data, req) => {
    const { simulationType, title, description, parameters } = data;

    // Create simulation record
    const sim = await Simulation.create({
        organizationId: req.organizationId,
        createdBy: req.user.userId,
        simulationType,
        title,
        description,
        parameters,
        status: 'running',
        executedAt: new Date(),
    });

    try {
        let results;

        switch (simulationType) {
            case SIMULATION_TYPES.SUPPLIER_FAILURE:
                results = await simulateSupplierFailure(parameters, req.organizationId);
                break;
            case SIMULATION_TYPES.SHIPMENT_DELAY:
                results = await simulateShipmentDelay(parameters, req.organizationId);
                break;
            case SIMULATION_TYPES.DEMAND_SPIKE:
                results = await simulateDemandSpike(parameters, req.organizationId);
                break;
            case SIMULATION_TYPES.WEATHER_DISRUPTION:
                results = await simulateWeatherDisruption(parameters, req.organizationId);
                break;
            default:
                throw new Error(`Unknown simulation type: ${simulationType}`);
        }

        await Simulation.findByIdAndUpdate(sim._id, {
            status: 'completed',
            results,
            completedAt: new Date(),
        });

        await createLog({
            organizationId: req.organizationId,
            userId: req.user.userId,
            action: 'simulation.run',
            entityType: 'simulation',
            entityId: sim._id,
            metadata: { simulationType, title },
            status: 'success',
        }).catch((e) => logger.error('Audit log failed', { error: e.message }));

        return { ...sim.toObject(), results, status: 'completed' };
    } catch (err) {
        await Simulation.findByIdAndUpdate(sim._id, {
            status: 'failed',
            errorMessage: err.message,
            completedAt: new Date(),
        });
        throw err;
    }
};

/**
 * Simulate supplier failure impact
 * Spec §9: Identify affected shipments and inventory items
 */
const simulateSupplierFailure = async ({ supplierId, failureDurationDays = 30, affectedSkus = [] }, orgId) => {
    const supplier = await supplierRepository.findById(supplierId, orgId);
    if (!supplier) throw new Error('Supplier not found');

    const affectedShipments = await shipmentRepository.findBySupplier(supplierId, orgId);
    const affectedInventory = await inventoryRepository.findBySupplier(supplierId, orgId);

    const filteredInventory = affectedSkus.length > 0
        ? affectedInventory.filter((i) => affectedSkus.includes(i.sku))
        : affectedInventory;

    const criticalItems = filteredInventory.filter((i) => i.daysOfCover < failureDurationDays);
    const financialImpact = affectedShipments.reduce((sum, s) => sum + (s.totalValue || 0), 0);

    const recommendations = [];
    if (criticalItems.length > 0) {
        recommendations.push({
            priority: 'critical',
            action: `Source ${criticalItems.length} critical SKUs from alternative suppliers immediately`,
            rationale: `${criticalItems.length} items will stockout within ${failureDurationDays} days`,
        });
    }
    if (affectedShipments.length > 0) {
        recommendations.push({
            priority: 'high',
            action: `Reroute or cancel ${affectedShipments.length} in-transit shipments`,
            rationale: 'Supplier failure will halt all pending shipments',
        });
    }

    return {
        impactedShipmentsCount: affectedShipments.length,
        estimatedDelayDays: failureDurationDays,
        criticalInventoryItems: criticalItems.length,
        financialImpact,
        impactedShipments: affectedShipments.map((s) => ({ id: s._id, shipmentNumber: s.shipmentNumber, status: s.status })),
        criticalInventory: criticalItems.map((i) => ({ id: i._id, sku: i.sku, productName: i.productName, daysOfCover: i.daysOfCover })),
        recommendations,
    };
};

/**
 * Simulate shipment delay impact
 */
const simulateShipmentDelay = async ({ shipmentId, additionalDelayDays = 7 }, orgId) => {
    const shipment = await shipmentRepository.findById(shipmentId, orgId);
    if (!shipment) throw new Error('Shipment not found');

    const affectedInventory = shipment.items?.length > 0
        ? await Promise.all(shipment.items.map((item) => inventoryRepository.findBySKU(item.sku, orgId)))
        : [];

    const validInventory = affectedInventory.filter(Boolean);
    const criticalItems = validInventory.filter((i) => i.daysOfCover < additionalDelayDays);

    return {
        impactedShipmentsCount: 1,
        estimatedDelayDays: additionalDelayDays,
        criticalInventoryItems: criticalItems.length,
        financialImpact: shipment.totalValue || 0,
        impactedShipments: [{ id: shipment._id, shipmentNumber: shipment.shipmentNumber }],
        criticalInventory: criticalItems.map((i) => ({ id: i._id, sku: i.sku, daysOfCover: i.daysOfCover })),
        recommendations: criticalItems.length > 0
            ? [{ priority: 'high', action: 'Activate safety stock for affected SKUs', rationale: 'Delay will cause stockout' }]
            : [{ priority: 'low', action: 'Monitor shipment status', rationale: 'No critical inventory impact' }],
    };
};

/**
 * Simulate demand spike impact
 */
const simulateDemandSpike = async ({ skus = [], demandIncreasePercent = 50, durationDays = 30 }, orgId) => {
    const inventoryItems = skus.length > 0
        ? await Promise.all(skus.map((sku) => inventoryRepository.findBySKU(sku, orgId)))
        : await inventoryRepository.findAll_forAgent(orgId);

    const validItems = inventoryItems.filter(Boolean);

    const projectedStockLevels = validItems.map((item) => {
        const spikedDemand = item.averageDailyDemand * (1 + demandIncreasePercent / 100);
        const projectedDaysOfCover = item.currentStock / spikedDemand;
        const willStockout = projectedDaysOfCover < durationDays;

        return {
            sku: item.sku,
            productName: item.productName,
            currentStock: item.currentStock,
            normalDaysOfCover: item.daysOfCover,
            projectedDaysOfCover: Math.round(projectedDaysOfCover * 10) / 10,
            willStockout,
        };
    });

    const criticalItems = projectedStockLevels.filter((i) => i.willStockout);

    return {
        impactedShipmentsCount: 0,
        estimatedDelayDays: 0,
        criticalInventoryItems: criticalItems.length,
        financialImpact: 0,
        projectedStockLevels,
        criticalInventory: criticalItems,
        recommendations: criticalItems.length > 0
            ? [{ priority: 'high', action: `Place emergency orders for ${criticalItems.length} SKUs`, rationale: 'Demand spike will cause stockouts' }]
            : [{ priority: 'low', action: 'Current stock levels can absorb demand spike', rationale: 'No critical impact detected' }],
    };
};

/**
 * Simulate weather disruption impact
 */
const simulateWeatherDisruption = async ({ affectedRegion, estimatedDelayDays = 5 }, orgId) => {
    const activeShipments = await shipmentRepository.findActive(orgId);
    const affected = affectedRegion
        ? activeShipments.filter((s) => s.origin?.country === affectedRegion || s.destination?.country === affectedRegion)
        : activeShipments;

    return {
        impactedShipmentsCount: affected.length,
        estimatedDelayDays,
        criticalInventoryItems: 0,
        financialImpact: affected.reduce((sum, s) => sum + (s.totalValue || 0), 0),
        impactedShipments: affected.map((s) => ({ id: s._id, shipmentNumber: s.shipmentNumber, carrier: s.carrier })),
        criticalInventory: [],
        recommendations: [
            { priority: 'high', action: 'Contact carriers for weather contingency plans', rationale: 'Weather disruption detected on active routes' },
            { priority: 'medium', action: 'Review safety stock for affected destination regions', rationale: 'Delays may impact inventory levels' },
        ],
    };
};

module.exports = { getAll, getById, runSimulation };
