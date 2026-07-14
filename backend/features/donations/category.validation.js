import { body, param, query } from 'express-validator';

// Allows English + Urdu/Arabic + Numbers + common punctuation
const CATEGORY_NAME_REGEX = /^[\p{L}\p{N}\s\-\/&().,'’]+$/u;

export const createCategorySchema = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(CATEGORY_NAME_REGEX)
    .withMessage(
      'Category name contains invalid characters'
    ),

  body('nameUrdu')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Urdu name cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Icon name cannot exceed 100 characters'),

  body('color')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color'),

  body('isActive')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

export const updateCategorySchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(CATEGORY_NAME_REGEX)
    .withMessage(
      'Category name contains invalid characters'
    ),

  body('nameUrdu')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Urdu name cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Icon name cannot exceed 100 characters'),

  body('color')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color'),

  body('isActive')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

export const categoryIdSchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID')
];

export const categoryFilterSchema = [
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];