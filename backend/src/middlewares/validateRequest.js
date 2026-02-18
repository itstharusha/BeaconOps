// FILE: src/middlewares/validateRequest.js
// SPEC REFERENCE: Section 17 - Input Validation (Joi), Section 13 - Validation Failure Response

const { errorResponse } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Request validation middleware factory using Joi schemas
 * @param {object} schema - Joi schema with optional body, query, params keys
 * @returns Express middleware that validates request and returns 400 on failure
 *
 * Usage: router.post('/', validateRequest({ body: supplierCreateSchema }), controller.create)
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Validate request body
        if (schema.body) {
            console.log('--- VALIDATION DEBUG: Body Start ---');
            console.log('Raw Body:', req.body);
            if (req.body && req.body.email) {
                console.log('Email Value:', `"${req.body.email}"`);
                console.log('Email Length:', req.body.email.length);
                console.log('Email Type:', typeof req.body.email);
            }

            const { error } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
            if (error) {
                const joiErrors = error.details.map((d) => ({
                    field: d.path.join('.'),
                    message: d.message.replace(/['"]/g, ''),
                }));
                console.log('--- JOI VALIDATION ERROR ---');
                console.log(JSON.stringify(joiErrors, null, 2));
                errors.push(...joiErrors);
            } else {
                // Replace body with sanitized version (stripUnknown removes extra fields)
                const { value } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
                req.body = value;
            }
            console.log('--- VALIDATION DEBUG: Body End ---');
        }

        // Validate query parameters
        if (schema.query) {
            const { error, value } = schema.query.validate(req.query, { abortEarly: false, allowUnknown: true });
            if (error) {
                errors.push(...error.details.map((d) => ({
                    field: `query.${d.path.join('.')}`,
                    message: d.message.replace(/['"]/g, ''),
                })));
            } else {
                req.query = value;
            }
        }

        // Validate route parameters
        if (schema.params) {
            const { error, value } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map((d) => ({
                    field: `params.${d.path.join('.')}`,
                    message: d.message.replace(/['"]/g, ''),
                })));
            } else {
                req.params = value;
            }
        }

        if (errors.length > 0) {
            return errorResponse(res, 400, 'Validation failed', ERROR_CODES.VALIDATION_ERROR, errors);
        }

        next();
    };
};

module.exports = { validateRequest };
