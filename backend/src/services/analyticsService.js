// FILE: src/services/analyticsService.js
// SPEC REFERENCE: Section 7 - Dashboard Analytics, Section 10 - Risk Aggregation
// Aggregates data for admin/analyst dashboards

const supplierRepository = require('../repositories/supplierRepository');
const shipmentRepository = require('../repositories/shipmentRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const alertRepository = require('../repositories/alertRepository');
const riskScoreRepository = require('../repositories/riskScoreRepository');
const { SHIPMENT_STATUSES, ALERT_STATUSES, RISK_TIERS } = require('../utils/constants');

/**
 * Get aggregated dashboard statistics
 * Spec §7: Alert Summary, Risk Overview, Recent Activity, Key Metrics
 */
const getDashboardStats = async (organizationId) => {
    // 1. Alert Summary
    const allAlerts = await alertRepository.findAll(organizationId, { limit: 1000 });
    const alertStats = {
        total: allAlerts.totalCount,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        open: 0,
        resolved: 0,
    };

    allAlerts.data.forEach((alert) => {
        alertStats[alert.severity]++;
        if (alert.status !== ALERT_STATUSES.RESOLVED && alert.status !== ALERT_STATUSES.ARCHIVED) {
            alertStats.open++;
        } else {
            alertStats.resolved++;
        }
    });

    // 2. Risk Overview (Distribution)
    const supplierRisk = await riskScoreRepository.getRiskTierDistribution(organizationId, 'supplier');
    const shipmentRisk = await riskScoreRepository.getRiskTierDistribution(organizationId, 'shipment');
    const inventoryRisk = await riskScoreRepository.getRiskTierDistribution(organizationId, 'inventory');

    // 3. Status Counts
    const shipments = await shipmentRepository.findAll(organizationId, { limit: 1000 });
    const shipmentStats = {
        total: shipments.totalCount,
        delayed: 0,
        inTransit: 0,
        delivered: 0,
        exception: 0,
    };

    shipments.data.forEach((s) => {
        if (s.status === SHIPMENT_STATUSES.DELAYED) shipmentStats.delayed++;
        if (s.status === SHIPMENT_STATUSES.IN_TRANSIT) shipmentStats.inTransit++;
        if (s.status === SHIPMENT_STATUSES.DELIVERED) shipmentStats.delivered++;
        if (s.status === SHIPMENT_STATUSES.EXCEPTION) shipmentStats.exception++;
    });

    // 4. Critical Inventory
    const criticalInventory = await inventoryRepository.findCritical(organizationId);

    return {
        alerts: alertStats,
        riskDistribution: {
            supplier: supplierRisk,
            shipment: shipmentRisk,
            inventory: inventoryRisk,
        },
        shipments: shipmentStats,
        criticalInventoryCount: criticalInventory.length,
        lastUpdated: new Date(),
    };
};

/**
 * Get supplier performance overview
 */
const getSupplierAnalytics = async (organizationId) => {
    const suppliers = await supplierRepository.findAll(organizationId, { limit: 1000 });
    const sortedByRisk = [...suppliers.data].sort((a, b) => {
        const scoreA = a.riskScore?.overallScore || 0;
        const scoreB = b.riskScore?.overallScore || 0;
        return scoreB - scoreA; // Descending
    });

    return {
        totalSuppliers: suppliers.totalCount,
        topRiskySuppliers: sortedByRisk.slice(0, 5),
        averagePerformance: {
            onTimeDelivery: calculateAverage(suppliers.data, 'performanceMetrics.onTimeDeliveryRate'),
            defectRate: calculateAverage(suppliers.data, 'performanceMetrics.defectRate'),
        },
    };
};

const calculateAverage = (items, path) => {
    if (!items.length) return 0;
    const sum = items.reduce((acc, item) => {
        const val = path.split('.').reduce((obj, key) => obj?.[key], item);
        return acc + (Number(val) || 0);
    }, 0);
    return Math.round((sum / items.length) * 10) / 10;
};

module.exports = { getDashboardStats, getSupplierAnalytics };
