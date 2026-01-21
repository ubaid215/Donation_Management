import express from 'express';
import { 
  createDonation, 
  getMyDonations, 
  getDonation,
  getAllDonations,
  getAnalytics,
  getTopDonors
} from './donation.controller.js';
import { 
  createDonationSchema, 
  donationFilterSchema,
  donationIdSchema 
} from './validation.js';
import { validateRequest } from '../../middlewares/validation.js';
import { 
  authMiddleware, 
  adminOnlyMiddleware, 
  operatorScopeMiddleware 
} from '../../middlewares/auth.js';
import { auditReportExport } from '../../middlewares/audit.js';

// Import category routes
import categoryRoutes from './category.routes.js';

const router = express.Router();

// ===== DONATION CATEGORY ROUTES =====
// Mount category routes at /categories
router.use('/categories', categoryRoutes);

// ===== DONATION ANALYTICS ROUTES =====
// IMPORTANT: Analytics routes MUST come BEFORE /:id routes
// to prevent "analytics" from being treated as an ID

// Admin analytics routes (place these FIRST)
router.get(
  '/analytics/overview',
  authMiddleware,
  adminOnlyMiddleware,
  getAnalytics
);

router.get(
  '/analytics/top-donors',
  authMiddleware,
  adminOnlyMiddleware,
  getTopDonors
);

// ===== DONATION ROUTES =====

// Admin route for all donations
router.get(
  '/',
  authMiddleware,
  adminOnlyMiddleware,
  donationFilterSchema,
  validateRequest,
  getAllDonations
);

// Operator routes
router.post(
  '/',
  authMiddleware,
  operatorScopeMiddleware,
  createDonationSchema,
  validateRequest,
  auditReportExport,
  createDonation
);

router.get(
  '/my',
  authMiddleware,
  operatorScopeMiddleware,
  donationFilterSchema,
  validateRequest,
  getMyDonations
);


router.get(
  '/:id',
  authMiddleware,
  operatorScopeMiddleware,
  donationIdSchema,
  validateRequest,
  getDonation
);

export default router;