import express from 'express';
import {
  createCategory,
  getAllCategories,
  getActiveCategories, // Add this
  getCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats
} from './category.controller.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoryFilterSchema
} from './category.validation.js';
import { validateRequest } from '../../middlewares/validation.js';
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js';

const router = express.Router();

// For active categories, only require authentication (not admin)
router.get('/active', authMiddleware, getActiveCategories);

// All other category routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnlyMiddleware);

// Stats route - must come before /:id to prevent "stats" being treated as ID
router.get(
  '/:id/stats',
  categoryIdSchema,
  validateRequest,
  getCategoryStats
);

// Toggle status route - must come before /:id
router.patch(
  '/:id/toggle-status',
  categoryIdSchema,
  validateRequest,
  toggleCategoryStatus
);

// Get all categories (with optional filtering)
router.get(
  '/',
  categoryFilterSchema,
  validateRequest,
  getAllCategories
);

// Create new category
router.post(
  '/',
  createCategorySchema,
  validateRequest,
  createCategory
);

// Get single category by ID
router.get(
  '/:id',
  categoryIdSchema,
  validateRequest,
  getCategory
);

// Update category
router.put(
  '/:id',
  updateCategorySchema,
  validateRequest,
  updateCategory
);

// Delete category
router.delete(
  '/:id',
  categoryIdSchema,
  validateRequest,
  deleteCategory
);

export default router;