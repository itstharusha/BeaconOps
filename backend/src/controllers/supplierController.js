// FILE: src/controllers/supplierController.js
// SPEC REFERENCE: Section 13 - Supplier API

const supplierService = require('../services/supplierService');
const { successResponse } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
    try {
        const result = await supplierService.getAll(req.organizationId, req.query);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await supplierService.getById(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await supplierService.create(req.body, req);
        return successResponse(res, 201, result, 'Supplier created successfully');
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await supplierService.update(req.params.id, req.body, req);
        return successResponse(res, 200, result, 'Supplier updated successfully');
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const result = await supplierService.updateStatus(req.params.id, req.body.status, req);
        return successResponse(res, 200, result, 'Supplier status updated successfully');
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await supplierService.remove(req.params.id, req);
        return successResponse(res, 200, null, 'Supplier deleted successfully');
    } catch (error) {
        next(error);
    }
};

const getRiskHistory = async (req, res, next) => {
    try {
        const result = await supplierService.getRiskHistory(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getRiskHistory };
