// FILE: src/controllers/simulationController.js
// SPEC REFERENCE: Section 13 - Simulation API

const simulationService = require('../services/simulationService');
const { successResponse } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
    try {
        const result = await simulationService.getAll(req, req.query);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await simulationService.getById(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const runSimulation = async (req, res, next) => {
    try {
        const result = await simulationService.runSimulation(req.body, req);
        return successResponse(res, 201, result, 'Simulation completed successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, runSimulation };
