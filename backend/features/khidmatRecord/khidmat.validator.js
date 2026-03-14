// ============================================================
// features/khidmatRecord/khidmat.validator.js
// Request validation for KhidmatRecord endpoints
// ============================================================

import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';

// ─────────────────────────────────────────────
// Helper — run validators and return 400 on failure
// ─────────────────────────────────────────────
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ─────────────────────────────────────────────
// CREATE — POST /api/khidmat
// ─────────────────────────────────────────────
export const createKhidmatValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number format'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isDecimal({ decimal_digits: '0,2', force_decimal: false })
    .withMessage('Amount must be a valid decimal number')
    .custom(val => parseFloat(val) > 0).withMessage('Amount must be greater than 0'),

  body('categoryId')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isUUID().withMessage('Invalid category ID'),

  body('status')
    .optional()
    .isIn(['COMPLETED', 'PARTIAL', 'RECORD_ONLY'])
    .withMessage('Status must be COMPLETED, PARTIAL, or RECORD_ONLY'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Address must be at most 300 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  handleValidation
];

// ─────────────────────────────────────────────
// UPDATE — PUT /api/khidmat/:id
// ─────────────────────────────────────────────
export const updateKhidmatValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number format'),

  body('amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2', force_decimal: false })
    .withMessage('Amount must be a valid decimal number')
    .custom(val => parseFloat(val) > 0).withMessage('Amount must be greater than 0'),

  body('categoryId')
    .optional()
    .trim()
    .isUUID().withMessage('Invalid category ID'),

  body('status')
    .optional()
    .isIn(['COMPLETED', 'PARTIAL', 'RECORD_ONLY'])
    .withMessage('Status must be COMPLETED, PARTIAL, or RECORD_ONLY'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Address must be at most 300 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),

  handleValidation
];

// ─────────────────────────────────────────────
// DELETE — DELETE /api/khidmat/:id
// ─────────────────────────────────────────────
export const deleteKhidmatValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Deletion reason must be at most 300 characters'),

  handleValidation
];

// ─────────────────────────────────────────────
// LIST — GET /api/khidmat (query param validation)
// ─────────────────────────────────────────────
export const listKhidmatValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),

  query('status')
    .optional()
    .isIn(['COMPLETED', 'PARTIAL', 'RECORD_ONLY'])
    .withMessage('Invalid status filter'),

  query('categoryId')
    .optional()
    .isUUID().withMessage('Invalid category ID'),

  handleValidation
];

// ─────────────────────────────────────────────
// SEND WHATSAPP — POST /api/khidmat/:id/whatsapp
// ─────────────────────────────────────────────
export const sendWhatsappValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),
  handleValidation
];