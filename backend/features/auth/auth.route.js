import express from 'express';
import { 
  login, 
  verify, 
  createOperator, 
  getOperators, 
  updateOperator,
  getOperatorStats 
} from './auth.controller.js';
import { 
  loginSchema, 
  createOperatorSchema, 
  updateUserSchema 
} from './validation.js';
import { validateRequest } from '../../middlewares/validation.js';
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginSchema, validateRequest, login);
router.get('/verify', authMiddleware, verify);

// Admin-only routes
router.post(
  '/operators',
  authMiddleware,
  adminOnlyMiddleware,
  createOperatorSchema,
  validateRequest,
  createOperator
);

router.get(
  '/operators',
  authMiddleware,
  adminOnlyMiddleware,
  getOperators
);

router.patch(
  '/operators/:id',
  authMiddleware,
  adminOnlyMiddleware,
  updateUserSchema,
  validateRequest,
  updateOperator
);

router.get(
  '/operators/stats',
  authMiddleware,
  adminOnlyMiddleware,
  getOperatorStats
);

export default router;