// FILE: src/controllers/authController.js
// SPEC REFERENCE: Section 13 - Authentication Requirements, API Contract

const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        return successResponse(res, 201, result, 'User registered successfully');
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const result = await authService.login({ email, password, ipAddress, userAgent });

        // Set refresh token cookie (Spec §17: HTTP-only)
        const { getRefreshCookieOptions } = require('../config/jwt');
        res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

        return successResponse(res, 200, {
            accessToken: result.accessToken,
            user: result.user,
        }, 'Login successful');
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // Clear refresh token cookie
        res.clearCookie('refreshToken', { path: '/api/auth' });
        return successResponse(res, 200, null, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return errorResponse(res, 401, 'Refresh token required');
        }

        const result = await authService.refreshAccessToken(token);

        // Set new refresh token cookie (Rotation policy)
        const { getRefreshCookieOptions } = require('../config/jwt');
        res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

        return successResponse(res, 200, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user.userId, currentPassword, newPassword);

        // Spec §17: Invalidate sessions (client should handle logout)
        return successResponse(res, 200, null, 'Password changed successfully');
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        // Return current user info from token/DB
        // For now just return what's in req.user which was populated by authenticate middleware
        // In real app might want to fetch fresh from DB
        return successResponse(res, 200, req.user);
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, logout, refreshToken, changePassword, me };
