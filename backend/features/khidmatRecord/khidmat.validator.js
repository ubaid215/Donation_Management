// ============================================================
// features/khidmatRecord/khidmat.validator.js
// ============================================================

import { body, param, query } from 'express-validator'
import { validationResult } from 'express-validator'

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────
export const createKhidmatValidator = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('phone')
    .trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number format'),

  body('amount')
    .notEmpty().withMessage('Total pledged amount is required')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal')
    .custom(val => parseFloat(val) > 0).withMessage('Amount must be greater than 0'),

  // receivedAmount is optional on create — defaults to 0
  body('receivedAmount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Received amount must be a valid decimal')
    .custom((val, { req }) => {
      const received = parseFloat(val)
      const total    = parseFloat(req.body.amount)
      if (received < 0)       throw new Error('Received amount cannot be negative')
      if (received > total)   throw new Error('Received amount cannot exceed total pledged amount')
      return true
    }),

  body('categoryId')
    .trim().notEmpty().withMessage('Category is required')
    .isUUID().withMessage('Invalid category ID'),

  body('status')
    .optional()
    .isIn(['COMPLETED', 'PARTIAL', 'RECORD_ONLY'])
    .withMessage('Status must be COMPLETED, PARTIAL, or RECORD_ONLY'),

  body('address')
    .optional().trim()
    .isLength({ max: 300 }).withMessage('Address must be at most 300 characters'),

  body('notes')
    .optional().trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  handleValidation
]

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────
export const updateKhidmatValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),

  body('name')
    .optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('phone')
    .optional().trim()
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number format'),

  body('amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal')
    .custom(val => parseFloat(val) > 0).withMessage('Amount must be greater than 0'),

  body('categoryId')
    .optional().trim()
    .isUUID().withMessage('Invalid category ID'),

  body('status')
    .optional()
    .isIn(['COMPLETED', 'PARTIAL', 'RECORD_ONLY'])
    .withMessage('Status must be COMPLETED, PARTIAL, or RECORD_ONLY'),

  body('address')
    .optional().trim()
    .isLength({ max: 300 }).withMessage('Address must be at most 300 characters'),

  body('notes')
    .optional().trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),

  handleValidation
]

// ─────────────────────────────────────────────
// ADD PAYMENT (installment)
// POST /api/khidmat/:id/payments
// ─────────────────────────────────────────────
export const addPaymentValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),

  body('amount')
    .notEmpty().withMessage('Payment amount is required')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal')
    .custom(val => parseFloat(val) > 0).withMessage('Payment amount must be greater than 0'),

  body('notes')
    .optional().trim()
    .isLength({ max: 300 }).withMessage('Notes must be at most 300 characters'),

  body('paidAt')
    .optional()
    .isISO8601().withMessage('paidAt must be a valid ISO 8601 date'),

  handleValidation
]

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
export const deleteKhidmatValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),

  body('reason')
    .optional().trim()
    .isLength({ max: 300 }).withMessage('Reason must be at most 300 characters'),

  handleValidation
]

// ─────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────
export const listKhidmatValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be 1–200'),
  query('status').optional().isIn(['COMPLETED', 'PARTIAL', 'RECORD_ONLY']).withMessage('Invalid status'),
  query('categoryId').optional().isUUID().withMessage('Invalid category ID'),
  handleValidation
]

// ─────────────────────────────────────────────
// SEND WHATSAPP
// ─────────────────────────────────────────────
export const sendWhatsappValidator = [
  param('id').isUUID().withMessage('Invalid record ID'),
  handleValidation
]