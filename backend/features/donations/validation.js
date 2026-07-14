import { body, query, param } from 'express-validator';

export const createDonationSchema = [
  body('donorName')
    .trim()
    .notEmpty().withMessage('Donor name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('donorPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+[1-9]\d{7,19}$/)
    .withMessage('Valid international phone number required (e.g., +923001234567, +14155551234)'),
  
  // Email validation (optional field)
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
    .isUUID().withMessage('Invalid category ID'),
  
  // WhatsApp notification toggle (admin only)
  body('sendWhatsApp')
    .optional()
    .isBoolean().withMessage('sendWhatsApp must be a boolean')
    .toBoolean()
    .default(true)
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
    .isInt({ min: 1, max: 100 }).toInt(),
  
  query('operatorId')
    .optional()
    .isUUID().withMessage('Invalid operator ID'),
  
  query('emailStatus')
    .optional()
    .isIn(['sent', 'not_sent', 'whatsapp_sent', 'whatsapp_not_sent'])
    .withMessage('Invalid email status'),
  
  query('whatsappStatus')
    .optional()
    .isIn(['sent', 'not_sent'])
    .withMessage('Invalid WhatsApp status'),
  
  query('isDeleted')
    .optional()
    .isBoolean().withMessage('isDeleted must be a boolean')
    .toBoolean()
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
    .matches(/^\+[1-9]\d{7,19}$/)
    .withMessage('Valid international phone number required (e.g., +923001234567, +14155551234)')
];

export const updateDonationSchema = [
  param('id')
    .isUUID().withMessage('Invalid donation ID'),
  
  body('donorName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('donorPhone')
    .optional()
    .trim()
    .matches(/^\+[1-9]\d{7,19}$/)
    .withMessage('Valid international phone number required (e.g., +923001234567, +14155551234)'),
  
  body('donorEmail')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email too long'),
  
  body('amount')
    .optional()
    .isFloat({ min: 1 }).withMessage('Amount must be at least Rs 1')
    .toFloat(),
  
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Purpose too long'),
  
  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE'])
    .withMessage('Invalid payment method'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long'),
  
  body('receiptNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Receipt number too long'),
  
  // Ensure at least one field is provided for update
  body()
    .custom((value, { req }) => {
      const updateFields = ['donorName', 'donorPhone', 'donorEmail', 'amount', 'purpose', 'paymentMethod', 'notes', 'receiptNumber'];
      const hasUpdate = updateFields.some(field => req.body[field] !== undefined);
      if (!hasUpdate) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    })
];

export const deleteRestoreDonationSchema = [
  param('id')
    .isUUID().withMessage('Invalid donation ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
    .withMessage('Reason must be between 5 and 500 characters')
];

// For creating a donation with optional email sending
export const createDonationWithEmailSchema = [
  ...createDonationSchema,
  body('sendEmail')
    .optional()
    .isBoolean().withMessage('sendEmail must be a boolean')
    .toBoolean(),
  
  body('customMessage')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Custom message too long')
];