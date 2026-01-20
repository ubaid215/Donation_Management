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