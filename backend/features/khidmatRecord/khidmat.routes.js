// ============================================================
// features/khidmatRecord/khidmat.routes.js (updated)
// ============================================================

import { Router } from 'express'
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js'

import {
  createRecord, getAllRecords, getRecord, updateRecord,
  deleteRecord, restoreRecord, addPayment, getPayments,
  getStats, getAnalytics, sendWhatsApp
} from './khidmat.controller.js'

// Import bulk reminder controllers
import { 
  previewBulkReminders, 
  sendBulkRemindersController 
} from './khidmatBulk.controller.js'

import {
  createKhidmatValidator, updateKhidmatValidator,
  deleteKhidmatValidator, listKhidmatValidator,
  sendWhatsappValidator, addPaymentValidator,
  bulkReminderValidator, bulkReminderPreviewValidator  // Add these imports
} from './khidmat.validator.js'

import {
  generateKhidmatReport, generateKhidmatCategoryReport, generateKhidmatReceipt
} from './khidmatReport.controller.js'

const router = Router()

router.use(authMiddleware)

// ── Static routes first (before /:id) ────────
router.get('/stats',     adminOnlyMiddleware, getStats)
router.get('/analytics', getAnalytics)               // accessible to all auth users

// ── Bulk Reminder Routes (Admin only or allow operators?) ──
// Preview route should come before the main bulk route
router.get('/bulk-reminders/preview', adminOnlyMiddleware, bulkReminderPreviewValidator, previewBulkReminders)
router.post('/bulk-reminders', adminOnlyMiddleware, bulkReminderValidator, sendBulkRemindersController)

// ── PDF Reports ───────────────────────────────
router.get('/reports/full',          generateKhidmatReport)
router.get('/reports/category',      generateKhidmatCategoryReport)
router.get('/reports/receipt/:id',   generateKhidmatReceipt)

// ── CRUD ──────────────────────────────────────
router.get('/',    listKhidmatValidator,   getAllRecords)
router.post('/',   createKhidmatValidator, createRecord)
router.get('/:id', getRecord)
router.put('/:id', updateKhidmatValidator, updateRecord)
router.delete('/:id', deleteKhidmatValidator, deleteRecord)

// ── Restore (Admin) ───────────────────────────
router.post('/:id/restore', adminOnlyMiddleware, restoreRecord)

// ── Payments / installments ───────────────────
router.post('/:id/payments', addPaymentValidator, addPayment)
router.get('/:id/payments',  getPayments)

// ── WhatsApp ──────────────────────────────────
router.post('/:id/whatsapp', sendWhatsappValidator, sendWhatsApp)

export default router