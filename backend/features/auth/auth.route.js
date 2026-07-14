import express from 'express';
import {
  login,
  verify,
  createOperator,
  getOperators,
  updateOperator,
  getOperatorStats,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
  updateProfile,
  changePassword,
  changeEmail
} from './auth.controller.js';
import {
  loginSchema,
  createOperatorSchema,
  updateUserSchema,
  requestResetSchema,
  resetPasswordSchema,
  verifyTokenSchema,
  updateProfileSchema,
  changeEmailSchema,
  changePasswordSchema
} from './validation.js';
import { validateRequest } from '../../middlewares/validation.js';
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginSchema, validateRequest, login);
router.get('/verify', authMiddleware, verify);

router.post(
  '/forgot-password',
  requestResetSchema,
  validateRequest,
  requestPasswordReset
);

router.post(
  '/verify-reset-token',
  verifyTokenSchema,
  validateRequest,
  verifyResetToken
);

router.post(
  '/reset-password',
  resetPasswordSchema,
  validateRequest,
  resetPassword
);

router.patch(
  '/profile',
  authMiddleware,
  updateProfileSchema,
  validateRequest,
  updateProfile
);

router.post(
  '/change-password',
  authMiddleware,
  changePasswordSchema,
  validateRequest,
  changePassword
);

// Admin-only routes
router.post(
  '/operators',
  authMiddleware,
  adminOnlyMiddleware,
  createOperatorSchema,
  validateRequest,
  createOperator
);

router.post(
  '/change-email',
  authMiddleware,
  adminOnlyMiddleware, 
  changeEmailSchema,
  validateRequest,
  changeEmail
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