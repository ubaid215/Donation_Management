import express from 'express';
import {
  getSystemStats,
  getDashboardMetrics,
  getDonationInsights,
  getTimeSeriesData,
  getCategoryBreakdown,
  getOperatorPerformance,
  exportData,
  // Category management
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
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

// Category Management
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.patch('/categories/:id/toggle-status', toggleCategoryStatus);

export default router;