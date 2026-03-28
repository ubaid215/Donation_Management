// ============================================================
// features/khidmatRecord/khidmatBulk.controller.js
// ============================================================

import asyncHandler from 'express-async-handler'
import prisma from '../../config/prisma.js'
import { sendBulkReminders } from '../../utils/bulkReminderWhatsApp.js'

/**
 * GET /api/khidmat/bulk-reminders/preview
 * Preview how many records would be affected by bulk reminder
 * 
 * Query params:
 *   statuses: comma-separated list (e.g., "PARTIAL,RECORD_ONLY")
 *   categoryId: optional
 *   startDate: optional
 *   endDate: optional
 */
export const previewBulkReminders = asyncHandler(async (req, res) => {
  const { statuses, categoryId, startDate, endDate } = req.query
  
  // Parse statuses from comma-separated string
  const statusArray = statuses 
    ? statuses.split(',').filter(s => ['PARTIAL', 'RECORD_ONLY', 'COMPLETED'].includes(s))
    : ['PARTIAL', 'RECORD_ONLY']
  
  const where = {
    isDeleted: false,
    status: { in: statusArray },
    ...(categoryId && { categoryId }),
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    })
  }
  
  const [total, byStatus] = await Promise.all([
    prisma.khidmatRecord.count({ where }),
    prisma.khidmatRecord.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ])
  
  res.json({
    success: true,
    total,
    byStatus: byStatus.map(s => ({
      status: s.status,
      count: s._count
    }))
  })
})

/**
 * POST /api/khidmat/bulk-reminders
 * Send bulk WhatsApp reminders
 * 
 * Body:
 * {
 *   statuses: ['PARTIAL', 'RECORD_ONLY'],  // optional, defaults to ['PARTIAL', 'RECORD_ONLY']
 *   filters: {                             // optional
 *     categoryId: '...',
 *     startDate: '2024-01-01',
 *     endDate: '2024-12-31'
 *   }
 * }
 */
export const sendBulkRemindersController = asyncHandler(async (req, res) => {
  const { statuses, filters = {} } = req.body
  
  const result = await sendBulkReminders({
    statuses: statuses || ['PARTIAL', 'RECORD_ONLY'],
    filters,
    userId: req.user.id,
    userRole: req.user.role,
    ipAddress: req.ip || req.connection.remoteAddress
  })
  
  res.json({
    success: true,
    message: `Bulk reminders sent: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`,
    ...result
  })
})