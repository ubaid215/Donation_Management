// ============================================================
// features/khidmatRecord/khidmat.routes.js
// Complete updated routes
// ============================================================

import { Router } from 'express'
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js'

import {
  createRecord, getAllRecords, getRecordsByPerson, getRecord, updateRecord,
  deleteRecord, restoreRecord, addPayment, getPayments,
  getStats, getAnalytics, sendWhatsApp,
  getPersonPayments, sendPersonWhatsApp,
  getSchedules, createSchedule, updateSchedule, deleteSchedule, runSchedule
} from './khidmat.controller.js'

import { 
  previewBulkReminders, 
  sendBulkRemindersController 
} from './khidmatBulk.controller.js'

import {
  createKhidmatValidator, updateKhidmatValidator,
  deleteKhidmatValidator, listKhidmatValidator,
  sendWhatsappValidator, addPaymentValidator,
  bulkReminderValidator, bulkReminderPreviewValidator
} from './khidmat.validator.js'

import {
  generateKhidmatReport, generateKhidmatCategoryReport, generateKhidmatReceipt,
  generateByPersonReport, generateSinglePersonReport
} from './khidmatReport.controller.js'

const router = Router()

router.use(authMiddleware)

// ── Static routes ────────────────────────────
router.get('/stats', adminOnlyMiddleware, getStats)
router.get('/analytics', getAnalytics)

// ── Person routes (before /:id) ──────────────
router.get('/person/:phone/payments', getPersonPayments)
router.post('/person/:phone/whatsapp', sendPersonWhatsApp)

// ── Bulk Reminder Routes ──────────────────────
router.get('/bulk-reminders/preview', adminOnlyMiddleware, bulkReminderPreviewValidator, previewBulkReminders)
router.post('/bulk-reminders', adminOnlyMiddleware, bulkReminderValidator, sendBulkRemindersController)

// ── Scheduler Routes ──────────────────────────
router.get('/schedules', adminOnlyMiddleware, getSchedules)
router.post('/schedules', adminOnlyMiddleware, createSchedule)
router.put('/schedules/:id', adminOnlyMiddleware, updateSchedule)
router.delete('/schedules/:id', adminOnlyMiddleware, deleteSchedule)
router.post('/schedules/:id/run', adminOnlyMiddleware, runSchedule)

// ── PDF Reports ───────────────────────────────
router.get('/reports/full', generateKhidmatReport)
router.get('/reports/category', generateKhidmatCategoryReport)
router.get('/reports/by-person', generateByPersonReport)
router.get('/reports/by-person/:phone', generateSinglePersonReport)
router.get('/reports/receipt/:id', generateKhidmatReceipt)

// ── CRUD ──────────────────────────────────────
router.get('/by-person', listKhidmatValidator, getRecordsByPerson)
router.get('/', listKhidmatValidator, getAllRecords)
router.post('/', createKhidmatValidator, createRecord)
router.get('/:id', getRecord)
router.put('/:id', updateKhidmatValidator, updateRecord)
router.delete('/:id', deleteKhidmatValidator, deleteRecord)

// ── Restore ────────────────────────────────────
router.post('/:id/restore', adminOnlyMiddleware, restoreRecord)

// ── Payments ──────────────────────────────────
router.post('/:id/payments', addPaymentValidator, addPayment)
router.get('/:id/payments', getPayments)

// ── WhatsApp ──────────────────────────────────
router.post('/:id/whatsapp', sendWhatsappValidator, sendWhatsApp)

export default router