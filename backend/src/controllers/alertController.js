// FILE: src/controllers/alertController.js
// SPEC REFERENCE: Section 13 - Alert API

const alertService = require('../services/alertService');
const { successResponse } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
    try {
        const result = await alertService.getAll(req, req.query);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await alertService.getById(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getMyAlerts = async (req, res, next) => {
    try {
        const result = await alertService.getMyAlerts(req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const assign = async (req, res, next) => {
    try {
        const { assigneeId } = req.body;
        const result = await alertService.assign(req.params.id, assigneeId, req);
        return successResponse(res, 200, result, 'Alert assigned successfully');
    } catch (error) {
        next(error);
    }
};

const acknowledge = async (req, res, next) => {
    try {
        const result = await alertService.acknowledge(req.params.id, req);
        return successResponse(res, 200, result, 'Alert acknowledged successfully');
    } catch (error) {
        next(error);
    }
};

const resolve = async (req, res, next) => {
    try {
        const { resolutionNotes } = req.body;
        const result = await alertService.resolve(req.params.id, resolutionNotes, req);
        return successResponse(res, 200, result, 'Alert resolved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, getMyAlerts, assign, acknowledge, resolve };
