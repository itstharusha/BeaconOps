// FILE: src/routes/adminRoutes.js
// SPEC REFERENCE: Section 13 - Admin Routes, RBAC (Admin only)

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const Joi = require('joi');

const updateConfigSchema = Joi.object({
    riskThresholds: Joi.object().optional(),
    alertEscalationRules: Joi.array().optional(),
    notificationChannels: Joi.object().optional(),
    agentSchedule: Joi.object().optional(),
});

const triggerAgentSchema = Joi.object({
    agentName: Joi.string().valid('supplierRiskAgent', 'shipmentRiskAgent', 'inventoryRiskAgent', 'alertEscalationAgent').required(),
});

router.use(authenticate);

// Organization Settings
router.get('/config', authorize('admin:access'), adminController.getOrgConfig);
router.put('/config', authorize('admin:access'), validateRequest({ body: updateConfigSchema }), adminController.updateOrgConfig);

// Agent Management (Super Admin or Risk Analyst)
router.post('/agents/trigger', authorize(['admin:access', 'risk:manage']), validateRequest({ body: triggerAgentSchema }), adminController.triggerRiskAgent);

module.exports = router;
