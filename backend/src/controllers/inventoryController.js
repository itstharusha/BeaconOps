// FILE: src/controllers/inventoryController.js
// SPEC REFERENCE: Section 13 - Inventory API

const inventoryService = require('../services/inventoryService');
const { successResponse } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
    try {
        const result = await inventoryService.getAll(req.organizationId, req.query);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await inventoryService.getById(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await inventoryService.create(req.body, req);
        return successResponse(res, 201, result, 'Inventory item created successfully');
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await inventoryService.update(req.params.id, req.body, req);
        return successResponse(res, 200, result, 'Inventory item updated successfully');
    } catch (error) {
        next(error);
    }
};

const adjustStock = async (req, res, next) => {
    try {
        const { adjustment, reason } = req.body;
        const result = await inventoryService.adjustStock(req.params.id, adjustment, reason, req);
        return successResponse(res, 200, result, 'Stock adjustment successful');
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await inventoryService.remove(req.params.id, req);
        return successResponse(res, 200, null, 'Inventory item deleted successfully');
    } catch (error) {
        next(error);
    }
};

const getRiskHistory = async (req, res, next) => {
    try {
        const result = await inventoryService.getRiskHistory(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, create, update, adjustStock, remove, getRiskHistory };
