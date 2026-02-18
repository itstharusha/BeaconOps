// FILE: src/routes/simulationRoutes.js
// SPEC REFERENCE: Section 13 - Simulation Routes, RBAC

const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const { PERMISSIONS } = require('../utils/constants');
const Joi = require('joi');

const runSimulationSchema = Joi.object({
    simulationType: Joi.string().valid('supplierFailure', 'shipmentDelay', 'demandSpike', 'weatherDisruption').required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    parameters: Joi.object().required().unknown(true), // Allow dynamic params based on type
});

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SIMULATIONS_VIEW), simulationController.getAll);
router.get('/:id', authorize(PERMISSIONS.SIMULATIONS_VIEW), simulationController.getById);

// Only analysts and managers can run simulations
router.post('/run', authorize(PERMISSIONS.SIMULATIONS_EXECUTE), validateRequest({ body: runSimulationSchema }), simulationController.runSimulation);

module.exports = router;
