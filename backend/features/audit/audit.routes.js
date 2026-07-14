import express from 'express';
import { getLogs, getLogStats } from './audit.controller.js';
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminOnlyMiddleware);

// Audit logs
router.get('/logs', getLogs);
router.get('/logs/stats', getLogStats);

export default router;