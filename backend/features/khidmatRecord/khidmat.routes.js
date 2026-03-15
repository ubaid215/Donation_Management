// ============================================================
// features/khidmatRecord/khidmat.routes.js
// ============================================================

import { Router } from 'express'
import { authMiddleware, adminOnlyMiddleware } from '../../middlewares/auth.js'

import {
  createRecord, getAllRecords, getRecord, updateRecord,
  deleteRecord, restoreRecord, addPayment, getPayments,
  getStats, getAnalytics, sendWhatsApp
} from './khidmat.controller.js'

import {
  createKhidmatValidator, updateKhidmatValidator,
  deleteKhidmatValidator, listKhidmatValidator,
  sendWhatsappValidator, addPaymentValidator
} from './khidmat.validator.js'

import {
  generateKhidmatReport, generateKhidmatCategoryReport, generateKhidmatReceipt
} from './khidmatReport.controller.js'

const router = Router()

router.use(authMiddleware)

// ── Static routes first (before /:id) ────────
router.get('/stats',     adminOnlyMiddleware, getStats)
router.get('/analytics', getAnalytics)               // accessible to all auth users

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