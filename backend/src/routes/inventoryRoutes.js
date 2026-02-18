// FILE: src/routes/inventoryRoutes.js
// SPEC REFERENCE: Section 13 - Inventory Routes, RBAC

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const { PERMISSIONS } = require('../utils/constants');
const Joi = require('joi');

const createInventorySchema = Joi.object({
    sku: Joi.string().required(),
    productName: Joi.string().required(),
    category: Joi.string().required(),
    supplierId: Joi.string().optional(),
    unitOfMeasure: Joi.string().default('units'),
    currentStock: Joi.number().min(0).default(0),
    reorderPoint: Joi.number().min(0).default(0),
    safetyStock: Joi.number().min(0).default(0),
    leadTimeDays: Joi.number().min(0).default(7),
    averageDailyDemand: Joi.number().min(0).default(0),
    location: Joi.string(),
});

const updateInventorySchema = Joi.object({
    productName: Joi.string(),
    category: Joi.string(),
    supplierId: Joi.string(),
    reorderPoint: Joi.number().min(0),
    safetyStock: Joi.number().min(0),
    leadTimeDays: Joi.number().min(0),
    averageDailyDemand: Joi.number().min(0),
    location: Joi.string(),
    version: Joi.number(), // Optimistic locking
});

const adjustStockSchema = Joi.object({
    adjustment: Joi.number().integer().required(), // Can be negative
    reason: Joi.string().required(),
});

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getAll);
router.get('/:id', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getById);
router.get('/:id/risk-history', authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getRiskHistory);

router.post('/', authorize(PERMISSIONS.INVENTORY_CREATE), validateRequest({ body: createInventorySchema }), inventoryController.create);
router.put('/:id', authorize(PERMISSIONS.INVENTORY_UPDATE), validateRequest({ body: updateInventorySchema }), inventoryController.update);
router.post('/:id/adjust', authorize(PERMISSIONS.INVENTORY_UPDATE), validateRequest({ body: adjustStockSchema }), inventoryController.adjustStock);
router.delete('/:id', authorize(PERMISSIONS.INVENTORY_DELETE), inventoryController.remove);

module.exports = router;
