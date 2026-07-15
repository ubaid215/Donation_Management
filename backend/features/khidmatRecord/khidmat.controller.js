// ====
// features/khidmatRecord/khidmat.controller.js


// Complete updated controller with new endpoints

// ====

import asyncHandler from 'express-async-handler'
import { KhidmatRecordService } from './khidmat.service.js'

import { sendKhidmatWhatsApp }  from '../../utils/recordNotification.js'

import { sendKhidmatWhatsApp } from '../../utils/recordNotification.js'


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
// GET /api/khidmat/by-person
// ─────────────────────────────────────────────
export const getRecordsByPerson = asyncHandler(async (req, res) => {
  const result = await service.getRecordsGroupedByPerson(req.query, req.user)
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

// POST /api/khidmat/:id/restore

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

// GET /api/khidmat/person/:phone/payments
// Get full payment history for a person grouped by category
// ─────────────────────────────────────────────
export const getPersonPayments = asyncHandler(async (req, res) => {
  const { phone } = req.params
  const data = await service.getPersonPayments(phone)
  res.json({ success: true, ...data })
})

// ─────────────────────────────────────────────
// POST /api/khidmat/person/:phone/whatsapp
// Send WhatsApp to all records of a person
// ─────────────────────────────────────────────
export const sendPersonWhatsApp = asyncHandler(async (req, res) => {
  const { phone } = req.params
  const { statusFilter } = req.query
  
  const result = await service.sendPersonWhatsApp(
    phone,
    statusFilter,
    req.user.id,
    req.user.role,
    req.ip || req.connection.remoteAddress
  )
  
  res.json({
    success: true,
    message: `WhatsApp messages sent for ${result.total} records`,
    ...result
  })
})

// ─────────────────────────────────────────────
// GET /api/khidmat/stats

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

// ─────────────────────────────────────────────
// SCHEDULER ENDPOINTS
// ─────────────────────────────────────────────

// GET /api/khidmat/schedules
export const getSchedules = asyncHandler(async (req, res) => {
  const result = await service.getSchedules({
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    search: req.query.search,
    frequency: req.query.frequency,
  })
  
  res.json({
    success: true,
    ...result
  })
})

// POST /api/khidmat/schedules
export const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await service.createSchedule(
    req.body,
    req.user.id,
    req.ip || req.connection.remoteAddress
  )
  res.status(201).json({ success: true, schedule })
})

// PUT /api/khidmat/schedules/:id
export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await service.updateSchedule(
    req.params.id,
    req.body,
    req.user.id,
    req.ip || req.connection.remoteAddress
  )
  res.json({ success: true, schedule })
})

// DELETE /api/khidmat/schedules/:id
export const deleteSchedule = asyncHandler(async (req, res) => {
  await service.deleteSchedule(
    req.params.id,
    req.user.id,
    req.ip || req.connection.remoteAddress
  )
  res.json({ success: true, message: 'Schedule deleted successfully' })
})

// POST /api/khidmat/schedules/:id/run
export const runSchedule = asyncHandler(async (req, res) => {
  const result = await service.runSchedule(
    req.params.id,
    req.user.id,
    req.user.role,
    req.ip || req.connection.remoteAddress
  )
  res.json({
    success: true,
    message: `Schedule run completed: ${result.sent} sent, ${result.failed} failed`,
    ...result
  })

})