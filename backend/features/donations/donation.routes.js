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
  sendDonationReceiptEmail,
  resendDonationReceiptEmail,
  getDonationEmailStatus,
  updateDonation,
  getDonationHistory,
  softDeleteDonation,
  restoreDonation,
  getDeletedDonations
} from './donation.controller.js';
import { 
  createDonationSchema, 
  donationFilterSchema,
  donationIdSchema,
  donorSearchSchema,
  donorPhoneSchema,
  updateDonationSchema,
  deleteRestoreDonationSchema,
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

// ===== SINGLE DONATION ROUTES WITH SUB-ROUTES =====
// These routes use the :id parameter and should be grouped together
// IMPORTANT: These come after all static routes

// EMAIL-RELATED ROUTES
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

// DONATION HISTORY ROUTE
// Get donation history/audit trail
router.get(
  '/:id/history',
  authMiddleware,
  operatorScopeMiddleware, // Operators can view history of their own donations
  donationIdSchema,
  validateRequest,
  getDonationHistory
);

// RESTORE ROUTE (must come before DELETE to avoid conflict)
// Restore soft-deleted donation (admin only)
router.post(
  '/:id/restore',
  authMiddleware,
  adminOnlyMiddleware,
  deleteRestoreDonationSchema,
  validateRequest,
  restoreDonation
);

// UPDATE DONATION ROUTE
// Update donation (admin can update any, operators can update their own)
router.put(
  '/:id',
  authMiddleware,
  updateDonationSchema,
  validateRequest,
  updateDonation
);

// SOFT DELETE DONATION ROUTE
// Soft delete donation (admin only)
router.delete(
  '/:id',
  authMiddleware,
  adminOnlyMiddleware,
  deleteRestoreDonationSchema,
  validateRequest,
  softDeleteDonation
);

router.get(
  '/deleted',
  authMiddleware,
  adminOnlyMiddleware,
  donationFilterSchema,
  validateRequest,
  getDeletedDonations
);

// GET SINGLE DONATION ROUTE
// This should be LAST to avoid route conflicts with the above sub-routes
router.get(
  '/:id',
  authMiddleware,
  operatorScopeMiddleware,
  donationIdSchema,
  validateRequest,
  getDonation
);

export default router;