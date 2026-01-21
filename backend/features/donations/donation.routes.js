import express from 'express';
import { 
  createDonation, 
  getMyDonations, 
  getDonation,
  getAllDonations,
  getAnalytics,
  getTopDonors,
  searchDonors,
  getDonorByPhone,
  getDonorSuggestions,
  // NEW: Add email-related controller functions
  sendDonationReceiptEmail,
  resendDonationReceiptEmail,
  getDonationEmailStatus
} from './donation.controller.js';
import { 
  createDonationSchema, 
  donationFilterSchema,
  donationIdSchema,
  donorSearchSchema,
  donorPhoneSchema,
  // NEW: Import email validation schemas
  sendEmailSchema
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

// ===== DONOR SEARCH ROUTES =====
// IMPORTANT: These MUST come BEFORE /:id routes to prevent route conflicts
// Accessible by both operators and admins

router.get(
  '/donors/search',
  authMiddleware,
  operatorScopeMiddleware,
  donorSearchSchema,
  validateRequest,
  searchDonors
);

router.get(
  '/donors/suggestions',
  authMiddleware,
  operatorScopeMiddleware,
  donorSearchSchema,
  validateRequest,
  getDonorSuggestions
);

router.get(
  '/donors/phone/:phone',
  authMiddleware,
  operatorScopeMiddleware,
  donorPhoneSchema,
  validateRequest,
  getDonorByPhone
);

// ===== EMAIL-RELATED ROUTES =====
// These should come BEFORE /:id routes to avoid conflicts

// Send receipt email for a donation (admin only)
router.post(
  '/:id/send-receipt',
  authMiddleware,
  adminOnlyMiddleware,
  sendEmailSchema,
  validateRequest,
  sendDonationReceiptEmail
);

// Resend receipt email (admin only)
router.post(
  '/:id/resend-receipt',
  authMiddleware,
  adminOnlyMiddleware,
  sendEmailSchema,
  validateRequest,
  resendDonationReceiptEmail
);

// Get email status for a donation (admin only)
router.get(
  '/:id/email-status',
  authMiddleware,
  adminOnlyMiddleware,
  donationIdSchema,
  validateRequest,
  getDonationEmailStatus
);

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

// ===== SINGLE DONATION ROUTES =====
// This should be LAST to avoid route conflicts

router.get(
  '/:id',
  authMiddleware,
  operatorScopeMiddleware,
  donationIdSchema,
  validateRequest,
  getDonation
);

export default router;