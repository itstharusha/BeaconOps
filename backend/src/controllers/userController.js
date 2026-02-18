// FILE: src/controllers/userController.js
// SPEC REFERENCE: Section 13 - User Management API

const userService = require('../services/userService');
const { successResponse } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
    try {
        const result = await userService.getAll(req, req.query);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await userService.getById(req.params.id, req);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await userService.create(req.body, req);
        return successResponse(res, 201, result, 'User created successfully');
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await userService.update(req.params.id, req.body, req);
        return successResponse(res, 200, result, 'User updated successfully');
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await userService.remove(req.params.id, req);
        return successResponse(res, 200, null, 'User deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, create, update, remove };
