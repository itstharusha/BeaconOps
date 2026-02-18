// FILE: src/routes/supplierRoutes.js
// SPEC REFERENCE: Section 13 - Supplier Routes, RBAC

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const { PERMISSIONS } = require('../utils/constants');
const Joi = require('joi');

const createSupplierSchema = Joi.object({
    name: Joi.string().required(),
    supplierCode: Joi.string().required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.string().valid('Manufacturer', 'Distributor', 'Logistics').required(),
});

const updateSupplierSchema = Joi.object({
    name: Joi.string(),
    contactEmail: Joi.string().email(),
    contactPhone: Joi.string(),
    country: Joi.string(),
    category: Joi.string().valid('Manufacturer', 'Distributor', 'Logistics'),
    status: Joi.string().valid('Active', 'Inactive', 'Suspended', 'OnHold'), // If updating status via full update
    version: Joi.number(), // Optimistic locking
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('Active', 'Inactive', 'Suspended', 'OnHold').required(),
});

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.getAll);
router.get('/:id', authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.getById);
router.get('/:id/risk-history', authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.getRiskHistory);

router.post('/', authorize(PERMISSIONS.SUPPLIERS_CREATE), validateRequest({ body: createSupplierSchema }), supplierController.create);
router.put('/:id', authorize(PERMISSIONS.SUPPLIERS_UPDATE), validateRequest({ body: updateSupplierSchema }), supplierController.update);
router.patch('/:id/status', authorize(PERMISSIONS.SUPPLIERS_UPDATE), validateRequest({ body: updateStatusSchema }), supplierController.updateStatus);
router.delete('/:id', authorize(PERMISSIONS.SUPPLIERS_DELETE), supplierController.remove);

module.exports = router;
