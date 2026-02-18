// FILE: src/controllers/adminController.js
// SPEC REFERENCE: Section 13 - Admin API (Org Settings, Agent Monitoring)

const OrganizationConfig = require('../models/OrganizationConfig');
const { triggerAgent } = require('../agents/agentScheduler');
const { successResponse } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Get organization configuration (Rules, Thresholds)
 */
const getOrgConfig = async (req, res, next) => {
    try {
        let config = await OrganizationConfig.findOne({ organizationId: req.organizationId });
        if (!config) {
            // Should exist from org creation, but lazy create if missing
            config = await OrganizationConfig.create({ organizationId: req.organizationId });
        }
        return successResponse(res, 200, config);
    } catch (error) {
        next(error);
    }
};

/**
 * Update organization configuration
 */
const updateOrgConfig = async (req, res, next) => {
    try {
        const config = await OrganizationConfig.findOneAndUpdate(
            { organizationId: req.organizationId },
            { $set: req.body },
            { new: true, upsert: true, runValidators: true }
        );
        return successResponse(res, 200, config, 'Organization settings updated');
    } catch (error) {
        next(error);
    }
};

/**
 * Manually trigger a risk agent
 */
const triggerRiskAgent = async (req, res, next) => {
    try {
        const { agentName } = req.body;
        const result = await triggerAgent(agentName);
        return successResponse(res, 200, result, `Agent '${agentName}' triggered successfully`);
    } catch (error) {
        next(error);
    }
};

module.exports = { getOrgConfig, updateOrgConfig, triggerRiskAgent };
