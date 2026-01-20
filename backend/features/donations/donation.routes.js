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

const router = express.Router();

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

// This route MUST come AFTER all specific routes like /analytics/*
router.get(
  '/:id',
  authMiddleware,
  operatorScopeMiddleware,
  donationIdSchema,
  validateRequest,
  getDonation
);

export default router;