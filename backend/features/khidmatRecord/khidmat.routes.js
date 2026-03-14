// ============================================================
// features/khidmatRecord/khidmat.routes.js
// All routes for the KhidmatRecord feature
//
// Mount in app.js:
//   import khidmatRoutes from './features/khidmatRecord/khidmat.routes.js';
//   app.use('/api/khidmat', khidmatRoutes);
// ============================================================

import { Router } from 'express';
import {
  authMiddleware,
  adminOnlyMiddleware
} from '../../middlewares/auth.js';

import {
  createRecord,
  getAllRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  restoreRecord,
  getStats,
  sendWhatsApp
} from './khidmat.controller.js';

// ── Report controllers ───────────────────────────────────────
import {
  generateKhidmatReport,
  generateKhidmatCategoryReport,
  generateKhidmatReceipt
} from './khidmatReport.controller.js';

import {
  createKhidmatValidator,
  updateKhidmatValidator,
  deleteKhidmatValidator,
  listKhidmatValidator,
  sendWhatsappValidator
} from './khidmat.validator.js';

const router = Router();

// All routes require a valid JWT
router.use(authMiddleware);

// ─────────────────────────────────────────────
// REPORTS  (placed before /:id to avoid param conflicts)
// ─────────────────────────────────────────────

// GET /api/khidmat/reports/full         — full filterable PDF
router.get('/reports/full', generateKhidmatReport);

// GET /api/khidmat/reports/category     — per-category PDF
// Query: ?categoryId=<uuid>  OR  ?categoryName=<name>
router.get('/reports/category', generateKhidmatCategoryReport);

// GET /api/khidmat/reports/receipt/:id  — single-record receipt PDF
router.get('/reports/receipt/:id', generateKhidmatReceipt);

// ─────────────────────────────────────────────
// STATS  — Admin only
// GET /api/khidmat/stats
// ─────────────────────────────────────────────
router.get('/stats', adminOnlyMiddleware, getStats);

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

// GET  /api/khidmat          — list (paginated)
router.get('/',    listKhidmatValidator,   getAllRecords);

// POST /api/khidmat          — create
router.post('/',   createKhidmatValidator, createRecord);

// GET  /api/khidmat/:id      — single record
router.get('/:id', getRecord);

// PUT  /api/khidmat/:id      — update
router.put('/:id', updateKhidmatValidator, updateRecord);

// DELETE /api/khidmat/:id   — soft delete
router.delete('/:id', deleteKhidmatValidator, deleteRecord);

// ─────────────────────────────────────────────
// RESTORE  — Admin only
// POST /api/khidmat/:id/restore
// ─────────────────────────────────────────────
router.post('/:id/restore', adminOnlyMiddleware, restoreRecord);

// ─────────────────────────────────────────────
// WHATSAPP  — Send notification (button click)
// POST /api/khidmat/:id/whatsapp
// ─────────────────────────────────────────────
router.post('/:id/whatsapp', sendWhatsappValidator, sendWhatsApp);

export default router;