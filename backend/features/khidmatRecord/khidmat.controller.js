// ============================================================
// features/khidmatRecord/khidmat.controller.js
// Express route handlers for KhidmatRecord
// ============================================================

import asyncHandler from 'express-async-handler';
import { KhidmatRecordService } from './khidmat.service.js';
import { sendKhidmatWhatsApp } from '../../utils/recordNotification.js';

const service = new KhidmatRecordService();

// ─────────────────────────────────────────────
// POST /api/khidmat
// Create a new khidmat record
// ─────────────────────────────────────────────
export const createRecord = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;

  const record = await service.createRecord(
    req.body,
    req.user.id,
    ipAddress
  );

  res.status(201).json({
    success: true,
    message: 'Khidmat record created successfully',
    record
  });
});

// ─────────────────────────────────────────────
// GET /api/khidmat
// List all records (filtered, paginated)
// ─────────────────────────────────────────────
export const getAllRecords = asyncHandler(async (req, res) => {
  const result = await service.getAllRecords(req.query, req.user);

  res.json({
    success: true,
    ...result
  });
});

// ─────────────────────────────────────────────
// GET /api/khidmat/:id
// Get a single record by ID
// ─────────────────────────────────────────────
export const getRecord = asyncHandler(async (req, res) => {
  const record = await service.getRecordById(req.params.id);

  res.json({
    success: true,
    record
  });
});

// ─────────────────────────────────────────────
// PUT /api/khidmat/:id
// Update a record
// ─────────────────────────────────────────────
export const updateRecord = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;

  const record = await service.updateRecord(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role,
    ipAddress
  );

  res.json({
    success: true,
    message: 'Khidmat record updated successfully',
    record
  });
});

// ─────────────────────────────────────────────
// DELETE /api/khidmat/:id
// Soft-delete a record
// ─────────────────────────────────────────────
export const deleteRecord = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;

  await service.deleteRecord(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body.reason || null,
    ipAddress
  );

  res.json({
    success: true,
    message: 'Khidmat record deleted successfully'
  });
});

// ─────────────────────────────────────────────
// POST /api/khidmat/:id/restore
// Restore a soft-deleted record (Admin only)
// ─────────────────────────────────────────────
export const restoreRecord = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;

  const record = await service.restoreRecord(
    req.params.id,
    req.user.id,
    req.user.role,
    ipAddress
  );

  res.json({
    success: true,
    message: 'Khidmat record restored successfully',
    record
  });
});

// ─────────────────────────────────────────────
// GET /api/khidmat/stats
// Overview statistics (Admin only)
// ─────────────────────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const stats = await service.getStats(req.query);

  res.json({
    success: true,
    stats
  });
});

// ─────────────────────────────────────────────
// POST /api/khidmat/:id/whatsapp
// Manually trigger WhatsApp notification for a record
// Called from frontend "Send WhatsApp" button
// ─────────────────────────────────────────────
export const sendWhatsApp = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await sendKhidmatWhatsApp(
    req.params.id,
    req.user.id,
    req.user.role,
    ipAddress
  );

  res.json({
    success: true,
    message: 'WhatsApp message sent successfully',
    messageId: result.messageId
  });
});