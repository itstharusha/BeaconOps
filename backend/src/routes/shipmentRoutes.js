// FILE: src/routes/shipmentRoutes.js
// SPEC REFERENCE: Section 13 - Shipment Routes, RBAC

const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const { PERMISSIONS } = require('../utils/constants');
const Joi = require('joi');

const createShipmentSchema = Joi.object({
    shipmentNumber: Joi.string().required(),
    supplierId: Joi.string().required(),
    orderDate: Joi.date().required(),
    estimatedArrival: Joi.date().required(),
    carrier: Joi.string().required(),
    totalValue: Joi.number().min(0).required(),
    origin: Joi.object({
        address: Joi.string(),
        country: Joi.string().required(),
        coordinates: Joi.array().items(Joi.number()).length(2),
    }).required(),
    destination: Joi.object({
        address: Joi.string(),
        country: Joi.string().required(),
        coordinates: Joi.array().items(Joi.number()).length(2),
    }).required(),
    items: Joi.array().items(Joi.object({
        sku: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
    })).min(1).required(),
});

const updateShipmentSchema = Joi.object({
    estimatedArrival: Joi.date(),
    carrier: Joi.string(),
    currentLocation: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
        timestamp: Joi.date().default(Date.now),
    }),
    version: Joi.number(), // Optimistic locking
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('Registered', 'InTransit', 'Delayed', 'Delivered', 'Cancelled', 'Exception').required(),
    reason: Joi.string(), // Reason for cancellation or exception
});

const trackingEventSchema = Joi.object({
    status: Joi.string().required(),
    location: Joi.string(),
    description: Joi.string().required(),
    timestamp: Joi.date().default(Date.now),
});

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SHIPMENTS_READ), shipmentController.getAll);
router.get('/:id', authorize(PERMISSIONS.SHIPMENTS_READ), shipmentController.getById);
router.get('/:id/risk-history', authorize(PERMISSIONS.SHIPMENTS_READ), shipmentController.getRiskHistory);

router.post('/', authorize(PERMISSIONS.SHIPMENTS_CREATE), validateRequest({ body: createShipmentSchema }), shipmentController.create);
router.put('/:id', authorize(PERMISSIONS.SHIPMENTS_UPDATE), validateRequest({ body: updateShipmentSchema }), shipmentController.update);
router.patch('/:id/status', authorize(PERMISSIONS.SHIPMENTS_TRACK), validateRequest({ body: updateStatusSchema }), shipmentController.updateStatus);
router.post('/:id/tracking', authorize(PERMISSIONS.SHIPMENTS_TRACK), validateRequest({ body: trackingEventSchema }), shipmentController.addTrackingEvent);
router.delete('/:id', authorize(PERMISSIONS.SHIPMENTS_DELETE), shipmentController.remove);

module.exports = router;
