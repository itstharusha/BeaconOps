// FILE: src/routes/authRoutes.js
// SPEC REFERENCE: Section 13 - API Routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middlewares/validateRequest');
const { authenticate } = require('../middlewares/authenticate');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const Joi = require('joi');

// Schemas
const registerSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid('superAdmin', 'orgAdmin', 'riskAnalyst', 'logisticsOperator', 'inventoryManager', 'viewer').required(),
    organizationId: Joi.string().optional(), // If invited
});

const loginSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
});

// Routes
router.post('/register', validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/change-password', authenticate, validateRequest({ body: changePasswordSchema }), authController.changePassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
