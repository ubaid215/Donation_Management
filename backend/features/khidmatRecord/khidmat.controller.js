// ============================================================
// features/khidmatRecord/khidmat.controller.js
// ============================================================

import asyncHandler from 'express-async-handler'
import { KhidmatRecordService } from './khidmat.service.js'
import { sendKhidmatWhatsApp }  from '../../utils/recordNotification.js'

const service = new KhidmatRecordService()

// ─────────────────────────────────────────────
// POST /api/khidmat
// ─────────────────────────────────────────────
export const createRecord = asyncHandler(async (req, res) => {
  const record = await service.createRecord(
    req.body, req.user.id, req.ip || req.connection.remoteAddress
  )
  res.status(201).json({ success: true, message: 'Khidmat record created successfully', record })
})

// ─────────────────────────────────────────────
// GET /api/khidmat
// ─────────────────────────────────────────────
export const getAllRecords = asyncHandler(async (req, res) => {
  const result = await service.getAllRecords(req.query, req.user)
  res.json({ success: true, ...result })
})

// ─────────────────────────────────────────────
// GET /api/khidmat/:id
// ─────────────────────────────────────────────
export const getRecord = asyncHandler(async (req, res) => {
  const record = await service.getRecordById(req.params.id)
  res.json({ success: true, record })
})

// ─────────────────────────────────────────────
// PUT /api/khidmat/:id
// ─────────────────────────────────────────────
export const updateRecord = asyncHandler(async (req, res) => {
  const record = await service.updateRecord(
    req.params.id, req.body, req.user.id, req.user.role,
    req.ip || req.connection.remoteAddress
  )
  res.json({ success: true, message: 'Khidmat record updated successfully', record })
})

// ─────────────────────────────────────────────
// DELETE /api/khidmat/:id
// ─────────────────────────────────────────────
export const deleteRecord = asyncHandler(async (req, res) => {
  await service.deleteRecord(
    req.params.id, req.user.id, req.user.role,
    req.body.reason || null, req.ip || req.connection.remoteAddress
  )
  res.json({ success: true, message: 'Khidmat record deleted successfully' })
})

// ─────────────────────────────────────────────
// POST /api/khidmat/:id/restore  (Admin only)
// ─────────────────────────────────────────────
export const restoreRecord = asyncHandler(async (req, res) => {
  const record = await service.restoreRecord(
    req.params.id, req.user.id, req.user.role,
    req.ip || req.connection.remoteAddress
  )
  res.json({ success: true, message: 'Khidmat record restored successfully', record })
})

// ─────────────────────────────────────────────
// POST /api/khidmat/:id/payments
// Add a new installment payment to a record
// ─────────────────────────────────────────────
export const addPayment = asyncHandler(async (req, res) => {
  const { record, payment } = await service.addPayment(
    req.params.id, req.body, req.user.id, req.user.role,
    req.ip || req.connection.remoteAddress
  )
  res.status(201).json({
    success: true,
    message: `Payment of Rs ${payment.amount} recorded. Total received: Rs ${record.receivedAmount} / Rs ${record.amount}`,
    record,
    payment
  })
})

// ─────────────────────────────────────────────
// GET /api/khidmat/:id/payments
// Get full payment history for a record
// ─────────────────────────────────────────────
export const getPayments = asyncHandler(async (req, res) => {
  const data = await service.getPayments(req.params.id)
  res.json({ success: true, ...data })
})

// ─────────────────────────────────────────────
// GET /api/khidmat/stats  (Admin only)
// ─────────────────────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const stats = await service.getStats(req.query)
  res.json({ success: true, stats })
})

// ─────────────────────────────────────────────
// GET /api/khidmat/analytics
// Chart data: monthly trend + by-category breakdown
// Query params: startDate, endDate, categoryId (optional filter)
// ─────────────────────────────────────────────
export const getAnalytics = asyncHandler(async (req, res) => {
  const data = await service.getAnalytics(req.query)
  res.json({ success: true, ...data })
})

// ─────────────────────────────────────────────
// POST /api/khidmat/:id/whatsapp
// ─────────────────────────────────────────────
export const sendWhatsApp = asyncHandler(async (req, res) => {
  const result = await sendKhidmatWhatsApp(
    req.params.id, req.user.id, req.user.role,
    req.ip || req.connection.remoteAddress
  )
  res.json({ success: true, message: 'WhatsApp message sent successfully', messageId: result.messageId })
})