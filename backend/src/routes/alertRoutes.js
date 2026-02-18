// FILE: src/routes/alertRoutes.js
// SPEC REFERENCE: Section 13 - Alert Routes, RBAC (State Machine Validation)

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const { PERMISSIONS } = require('../utils/constants');
const Joi = require('joi');

const assignAlertSchema = Joi.object({
    assigneeId: Joi.string().required(),
    version: Joi.number(), // Optimistic locking (optional)
});

const resolveAlertSchema = Joi.object({
    resolutionNotes: Joi.string().required(),
    version: Joi.number(), // Optimistic locking (optional)
});

router.use(authenticate);

// Viewers can see alerts, but might be restricted to assigned ones (service layer handles this)
router.get('/', authorize(PERMISSIONS.ALERTS_READ), alertController.getAll);
router.get('/my-alerts', authorize(PERMISSIONS.ALERTS_READ), alertController.getMyAlerts);
router.get('/:id', authorize(PERMISSIONS.ALERTS_READ), alertController.getById);

// Workflow actions
router.post('/:id/assign', authorize(PERMISSIONS.ALERTS_ASSIGN), validateRequest({ body: assignAlertSchema }), alertController.assign);
router.post('/:id/acknowledge', authorize(PERMISSIONS.ALERTS_ACKNOWLEDGE), alertController.acknowledge);
router.post('/:id/resolve', authorize(PERMISSIONS.ALERTS_RESOLVE), validateRequest({ body: resolveAlertSchema }), alertController.resolve);

module.exports = router;
