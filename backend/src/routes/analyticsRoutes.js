// FILE: src/routes/analyticsRoutes.js
// SPEC REFERENCE: Section 13 - Analytics Routes, RBAC

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { PERMISSIONS } = require('../utils/constants');

router.use(authenticate);

// Everyone with dashboard access can view main stats
// (permissions: analytics:viewReports)
router.get('/dashboard', authorize(PERMISSIONS.ANALYTICS_VIEW_REPORTS), analyticsController.getDashboardStats);
router.get('/suppliers', authorize(PERMISSIONS.ANALYTICS_VIEW_REPORTS), analyticsController.getSupplierAnalytics);

module.exports = router;
