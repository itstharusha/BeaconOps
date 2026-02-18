// FILE: src/controllers/analyticsController.js
// SPEC REFERENCE: Section 13 - Analytics API

const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/apiResponse');

const getDashboardStats = async (req, res, next) => {
    try {
        const result = await analyticsService.getDashboardStats(req.organizationId);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getSupplierAnalytics = async (req, res, next) => {
    try {
        const result = await analyticsService.getSupplierAnalytics(req.organizationId);
        return successResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats, getSupplierAnalytics };
