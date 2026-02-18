// FILE: src/routes/userRoutes.js
// SPEC REFERENCE: Section 13 - User Routes, RBAC (Admin only for management)

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { validateRequest } = require('../middlewares/validateRequest');
const { PERMISSIONS, ROLES } = require('../utils/constants');
const Joi = require('joi');

const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
});

const updateUserSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    role: Joi.string().valid(...Object.values(ROLES)),
    password: Joi.string().min(8),
    isActive: Joi.boolean(),
});

// All routes require authentication
router.use(authenticate);

// List users
router.get('/', authorize(PERMISSIONS.USERS_READ), userController.getAll);
router.get('/:id', authorize(PERMISSIONS.USERS_READ), userController.getById);

router.post('/', authorize(PERMISSIONS.USERS_CREATE), validateRequest({ body: createUserSchema }), userController.create);
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), validateRequest({ body: updateUserSchema }), userController.update);
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), userController.remove);

module.exports = router;
