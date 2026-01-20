import express from 'express';
import {
  generateDonationReport,
  generateAnalyticsReport
} from './reports.controller.js';
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js';
import { auditReportExport } from '../../middlewares/audit.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminOnlyMiddleware, auditReportExport);

// PDF Reports
router.get('/donations', generateDonationReport);
router.get('/analytics', generateAnalyticsReport);

export default router;