// FILE: src/controllers/shipmentController.js
// SPEC REFERENCE: Section 13 - Shipment API

const shipmentService = require('../services/shipmentService');
const { successResponse } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
    try {
        const result = await shipmentService.getAll(req.organizationId, req.query);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await shipmentService.getById(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await shipmentService.create(req.body, req);
        return successResponse(res, 201, result, 'Shipment created successfully');
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await shipmentService.update(req.params.id, req.body, req);
        return successResponse(res, 200, result, 'Shipment updated successfully');
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const result = await shipmentService.updateStatus(req.params.id, req.body.status, req.body, req);
        return successResponse(res, 200, result, 'Shipment status updated successfully');
    } catch (error) {
        next(error);
    }
};

const addTrackingEvent = async (req, res, next) => {
    try {
        const result = await shipmentService.addTrackingEvent(req.params.id, req.body, req);
        return successResponse(res, 200, result, 'Tracking event added successfully');
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await shipmentService.remove(req.params.id, req);
        return successResponse(res, 200, null, 'Shipment deleted successfully');
    } catch (error) {
        next(error);
    }
};

const getRiskHistory = async (req, res, next) => {
    try {
        const result = await shipmentService.getRiskHistory(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, create, update, updateStatus, addTrackingEvent, remove, getRiskHistory };
