// FILE: src/config/agentConfig.js
// SPEC REFERENCE: Section 9 - AI Agent Architecture, Section 19 - Agent Monitoring
// Agent intervals: supplierRisk=240min, shipmentRisk=15min, inventoryRisk=30min, alertEscalation=5min

const { AGENT_NAMES } = require('../utils/constants');

const AGENT_CONFIG = {
    [AGENT_NAMES.SUPPLIER_RISK]: {
        name: AGENT_NAMES.SUPPLIER_RISK,
        cronSchedule: '0 */4 * * *',      // Every 4 hours
        intervalMinutes: 240,
        lockTimeoutMs: 5 * 60 * 1000,     // 5 minute lock timeout
        maxRetries: 3,
        enabled: true,
        description: 'Evaluates supplier risk scores based on performance metrics and financial data',
    },
    [AGENT_NAMES.SHIPMENT_RISK]: {
        name: AGENT_NAMES.SHIPMENT_RISK,
        cronSchedule: '*/15 * * * *',     // Every 15 minutes
        intervalMinutes: 15,
        lockTimeoutMs: 5 * 60 * 1000,
        maxRetries: 3,
        enabled: true,
        description: 'Evaluates shipment risk scores based on ETA deviation, weather, and carrier data',
    },
    [AGENT_NAMES.INVENTORY_RISK]: {
        name: AGENT_NAMES.INVENTORY_RISK,
        cronSchedule: '*/30 * * * *',     // Every 30 minutes
        intervalMinutes: 30,
        lockTimeoutMs: 5 * 60 * 1000,
        maxRetries: 3,
        enabled: true,
        description: 'Evaluates inventory risk scores based on stock levels and demand forecasts',
    },
    [AGENT_NAMES.ALERT_ESCALATION]: {
        name: AGENT_NAMES.ALERT_ESCALATION,
        cronSchedule: '*/5 * * * *',      // Every 5 minutes
        intervalMinutes: 5,
        lockTimeoutMs: 2 * 60 * 1000,
        maxRetries: 2,
        enabled: true,
        description: 'Escalates unresolved alerts based on severity and time thresholds',
    },
    [AGENT_NAMES.REPORT_GENERATOR]: {
        name: AGENT_NAMES.REPORT_GENERATOR,
        cronSchedule: '0 6 * * *',        // Daily at 6 AM UTC
        intervalMinutes: 1440,
        lockTimeoutMs: 10 * 60 * 1000,
        maxRetries: 1,
        enabled: true,
        description: 'Generates scheduled reports and exports',
    },
};

/**
 * External API configuration with retry settings
 * Spec §20: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
 */
const EXTERNAL_API_CONFIG = {
    timeout: 5000,           // 5 second request timeout
    maxRetries: 3,
    retryDelays: [1000, 2000, 4000], // Exponential backoff
    cacheMaxAge: 6 * 60 * 60 * 1000, // 6 hours - use cached data if API unavailable
};

module.exports = { AGENT_CONFIG, EXTERNAL_API_CONFIG };
