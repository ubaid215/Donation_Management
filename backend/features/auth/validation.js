import { body } from 'express-validator';

export const loginSchema = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

export const createOperatorSchema = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  
  body('phone')
    .notEmpty().withMessage('Phone number is required') // Changed from optional to required
    .matches(/^\+?[0-9\s\-\(\)]{10,20}$/).withMessage('Please enter a valid phone number')
    // Clean the phone number by removing non-digit characters except +
    .customSanitizer(value => {
      // Keep + if present, remove all other non-digit characters
      const hasPlus = value.startsWith('+');
      const digits = value.replace(/\D/g, '');
      return hasPlus ? `+${digits}` : digits;
    })
];

export const updateUserSchema = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[0-9\s\-\(\)]{10,20}$/).withMessage('Please enter a valid phone number'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean')
];

export const requestResetSchema = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .notEmpty().withMessage('Email is required')
];

export const resetPasswordSchema = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid reset token format'),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

export const verifyTokenSchema = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid reset token format')
];

export const updateProfileSchema = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage('Phone must be 5-20 characters')
];

export const changePasswordSchema = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

export const changeEmailSchema = [
  body('newEmail')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .notEmpty().withMessage('New email is required'),
  
  body('currentPassword')
    .notEmpty().withMessage('Current password is required')
];