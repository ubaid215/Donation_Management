import { body, query, param, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Donation validation rules
export const donationValidationRules = [
  body('donorName')
    .trim()
    .notEmpty().withMessage('Donor name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('donorPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
  
  body('amount')
    .isFloat({ min: 1 }).withMessage('Amount must be at least ₹1')
    .toFloat(),
  
  body('purpose')
    .trim()
    .notEmpty().withMessage('Purpose is required')
    .isLength({ max: 200 }).withMessage('Purpose too long'),
  
  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE'])
    .withMessage('Invalid payment method'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
];

//  create a new validation rule for operator

export const operatorCreateValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Operator name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    // Accept international phone numbers with + and digits
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Please enter a valid phone number (10-15 digits, + optional)')
];

// Login validation rules
export const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Admin filter validation
export const adminFilterValidationRules = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date'),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Invalid minimum amount'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Invalid maximum amount'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
];

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key].trim()
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
};