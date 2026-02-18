// FILE: src/agents/agentScheduler.js
// SPEC REFERENCE: Section 9 - Agent Scheduling, Section 19 - Agent Monitoring
// Cron schedules: supplierRisk=4h, shipmentRisk=15min, inventoryRisk=30min, alertEscalation=5min

const cron = require('node-cron');
const { AGENT_CONFIG } = require('../config/agentConfig');
const { AGENT_NAMES } = require('../utils/constants');
const { runSupplierRiskEvaluation } = require('./supplierRiskAgent');
const { runShipmentRiskEvaluation } = require('./shipmentRiskAgent');
const { runInventoryRiskEvaluation } = require('./inventoryRiskAgent');
const { runAlertEscalation } = require('./alertEscalationAgent');
const { logger } = require('../utils/logger');
const OrganizationConfig = require('../models/OrganizationConfig');

// Track running state to prevent concurrent execution (Spec §9: lock mechanism)
const agentLocks = {};

/**
 * Wrap agent execution with lock, error handling, and timing
 */
const runWithLock = async (agentName, agentFn) => {
    if (agentLocks[agentName]) {
        logger.warn(`${agentName}: Skipping run — previous execution still in progress`);
        return;
    }

    agentLocks[agentName] = true;
    const startTime = Date.now();

    try {
        logger.info(`${agentName}: Starting scheduled run`);
        const result = await agentFn();
        const duration = Date.now() - startTime;
        logger.info(`${agentName}: Completed in ${duration}ms`, result);

        // Update lastAgentRun in OrganizationConfig (best-effort)
        const runKey = agentName.replace('Agent', '').replace('Risk', 'Risk');
        await OrganizationConfig.updateMany(
            {},
            { $set: { [`lastAgentRun.${runKey}`]: new Date() } }
        ).catch((err) => logger.error(`Failed to update lastAgentRun for ${agentName}`, { error: err.message }));
    } catch (err) {
        const duration = Date.now() - startTime;
        logger.error(`${agentName}: Failed after ${duration}ms`, { error: err.message });
    } finally {
        agentLocks[agentName] = false;
    }
};

/**
 * Initialize and start all agent cron jobs
 * Spec §9: All agents run on fixed schedules, configurable per org
 */
const startAgentScheduler = () => {
    logger.info('AgentScheduler: Initializing all agent cron jobs');

    // ─── SUPPLIER RISK AGENT: Every 4 hours ───────────────────────────────────
    cron.schedule(AGENT_CONFIG[AGENT_NAMES.SUPPLIER_RISK].cronSchedule, async () => {
        await runWithLock(AGENT_NAMES.SUPPLIER_RISK, runSupplierRiskEvaluation);
    });

    // ─── SHIPMENT RISK AGENT: Every 15 minutes ────────────────────────────────
    cron.schedule(AGENT_CONFIG[AGENT_NAMES.SHIPMENT_RISK].cronSchedule, async () => {
        await runWithLock(AGENT_NAMES.SHIPMENT_RISK, runShipmentRiskEvaluation);
    });

    // ─── INVENTORY RISK AGENT: Every 30 minutes ───────────────────────────────
    cron.schedule(AGENT_CONFIG[AGENT_NAMES.INVENTORY_RISK].cronSchedule, async () => {
        await runWithLock(AGENT_NAMES.INVENTORY_RISK, runInventoryRiskEvaluation);
    });

    // ─── ALERT ESCALATION AGENT: Every 5 minutes ─────────────────────────────
    cron.schedule(AGENT_CONFIG[AGENT_NAMES.ALERT_ESCALATION].cronSchedule, async () => {
        await runWithLock(AGENT_NAMES.ALERT_ESCALATION, runAlertEscalation);
    });

    logger.info('AgentScheduler: All agents scheduled', {
        supplierRisk: AGENT_CONFIG[AGENT_NAMES.SUPPLIER_RISK].cronSchedule,
        shipmentRisk: AGENT_CONFIG[AGENT_NAMES.SHIPMENT_RISK].cronSchedule,
        inventoryRisk: AGENT_CONFIG[AGENT_NAMES.INVENTORY_RISK].cronSchedule,
        alertEscalation: AGENT_CONFIG[AGENT_NAMES.ALERT_ESCALATION].cronSchedule,
    });
};

/**
 * Manually trigger a specific agent (for admin API endpoint)
 * Spec §13: POST /api/admin/agents/:agentName/trigger
 */
const triggerAgent = async (agentName) => {
    const agentMap = {
        [AGENT_NAMES.SUPPLIER_RISK]: runSupplierRiskEvaluation,
        [AGENT_NAMES.SHIPMENT_RISK]: runShipmentRiskEvaluation,
        [AGENT_NAMES.INVENTORY_RISK]: runInventoryRiskEvaluation,
        [AGENT_NAMES.ALERT_ESCALATION]: runAlertEscalation,
    };

    const agentFn = agentMap[agentName];
    if (!agentFn) {
        const err = new Error(`Unknown agent: ${agentName}`);
        err.statusCode = 400;
        err.errorCode = 'VALIDATION_ERROR';
        throw err;
    }

    await runWithLock(agentName, agentFn);
    return { triggered: agentName, timestamp: new Date().toISOString() };
};

module.exports = { startAgentScheduler, triggerAgent };
