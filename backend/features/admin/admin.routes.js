import express from 'express';
import {
  getSystemStats,
  getDashboardMetrics,
  getDonationInsights,
  getTimeSeriesData,
  getCategoryBreakdown,
  getOperatorPerformance,
  exportData,
} from './admin.controller.js';
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware, adminOnlyMiddleware);

// System stats
router.get('/stats/system', getSystemStats);
router.get('/stats/dashboard', getDashboardMetrics);

// Analytics
router.get('/analytics/insights', getDonationInsights);
router.get('/analytics/time-series', getTimeSeriesData);
router.get('/analytics/categories', getCategoryBreakdown);
router.get('/analytics/operators', getOperatorPerformance);

// Data export
router.get('/export/:exportType', exportData);

export default router;