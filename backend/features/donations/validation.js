import { body, query, param } from 'express-validator';

export const createDonationSchema = [
  body('donorName')
    .trim()
    .notEmpty().withMessage('Donor name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('donorPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Valid 10-15 digit phone number required'),
  
  // NEW: Email validation (optional field)
  body('donorEmail')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email too long'),
  
  body('amount')
    .isFloat({ min: 1 }).withMessage('Amount must be at least Rs 1')
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
    .isLength({ max: 500 }).withMessage('Notes too long'),
  
  body('categoryId')
    .optional()
    .isUUID().withMessage('Invalid category ID')
];

// Email sending validation schema
export const sendEmailSchema = [
  param('id')
    .isUUID().withMessage('Invalid donation ID'),
  
  body('customMessage')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Custom message too long')
];

export const donationFilterSchema = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date'),
  
  query('purpose')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  
  query('paymentMethod')
    .optional()
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 }),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 }),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).toInt()
];

export const donationIdSchema = [
  param('id')
    .isUUID().withMessage('Invalid donation ID')
];

// Donor search validation schemas
export const donorSearchSchema = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt()
];

export const donorPhoneSchema = [
  param('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Invalid phone number format (10-15 characters, can include +, -, spaces, parentheses)')
];