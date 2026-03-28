// ============================================================
// utils/bulkReminderWhatsApp.js
// Sends reminder WhatsApp messages to multiple KhidmatRecords
// Filters by status, rate-limits to avoid Meta API throttling
// ============================================================

import prisma from '../config/prisma.js'
import { createAuditLog } from './auditLogger.js'

// ─── WhatsApp Cloud API call ─────────────────
const sendWhatsAppMessage = async (toPhone, templateName, components = []) => {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'template',
      template: { name: templateName, language: { code: 'en_us' }, components }
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`WhatsApp API error ${response.status}: ${JSON.stringify(err)}`)
  }

  return response.json()
}

const fmt = (val) =>
  parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

// ─────────────────────────────────────────────
// Build reminder template per status
//
// Required approved template names in Meta Business Manager:
//
//   khidmat_reminder_partial
//     Body: "Assalaamu Alaikum {{1}}, we wanted to kindly remind you
//            regarding your {{2}} khidmat. Total pledged: Rs {{3}}.
//            Amount received so far: Rs {{4}}. Remaining balance: Rs {{5}}.
//            JazakAllah Khair for your generosity."
//     Variables: name, category, totalAmount, receivedAmount, remainingAmount
//
//   khidmat_reminder_pending
//     Body: "Assalaamu Alaikum {{1}}, this is a gentle reminder regarding
//            your {{2}} khidmat pledge of Rs {{3}}.
//            No payment has been recorded yet.
//            JazakAllah Khair for your continued support."
//     Variables: name, category, totalAmount
//
//   khidmat_reminder_completed  (optional — thank you message)
//     Body: "Assalaamu Alaikum {{1}}, JazakAllah Khair for completing
//            your {{2}} khidmat of Rs {{3}}. May Allah accept it from you."
//     Variables: name, category, totalAmount
// ─────────────────────────────────────────────
const buildReminderPayload = (record, categoryName) => {
  const totalAmount     = parseFloat(record.amount.toString())
  const receivedAmount  = parseFloat(record.receivedAmount.toString())
  const remainingAmount = totalAmount - receivedAmount

  switch (record.status) {
    case 'PARTIAL':
      return {
        templateName: 'khidmat_reminder_partial',
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName },
            { type: 'text', text: `Rs ${fmt(totalAmount)}` },
            { type: 'text', text: `Rs ${fmt(receivedAmount)}` },
            { type: 'text', text: `Rs ${fmt(remainingAmount)}` }
          ]
        }]
      }

    case 'RECORD_ONLY':
      return {
        templateName: 'khidmat_reminder_pending',
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName },
            { type: 'text', text: `Rs ${fmt(totalAmount)}` }
          ]
        }]
      }

    case 'COMPLETED':
      return {
        templateName: 'khidmat_reminder_completed',
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName },
            { type: 'text', text: `Rs ${fmt(totalAmount)}` }
          ]
        }]
      }

    default:
      return null
  }
}

// ─── Simple delay helper for rate-limiting ───
const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// ─────────────────────────────────────────────
// Main export
//
// @param statuses  — array of statuses to include, e.g. ['PARTIAL', 'RECORD_ONLY']
// @param filters   — optional { categoryId, startDate, endDate }
// @param userId    — who triggered the bulk send
// @param userRole  — role of the triggering user
// @param ipAddress — for audit log
//
// Returns:
//   { sent: number, failed: number, skipped: number, results: [...] }
// ─────────────────────────────────────────────
export const sendBulkReminders = async ({
  statuses = ['PARTIAL', 'RECORD_ONLY'],
  filters  = {},
  userId,
  userRole,
  ipAddress = null
}) => {
  if (!statuses || statuses.length === 0) {
    throw new Error('At least one status must be specified')
  }

  const { categoryId, startDate, endDate } = filters

  const where = {
    isDeleted: false,
    status:    { in: statuses },
    ...(categoryId && { categoryId }),
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate)   })
      }
    })
  }

  const records = await prisma.khidmatRecord.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  })

  if (records.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, results: [] }
  }

  const results   = []
  let sent    = 0
  let failed  = 0
  let skipped = 0

  for (const record of records) {
    const categoryName = record.category?.name ?? 'General'
    const payload      = buildReminderPayload(record, categoryName)

    // Skip if no template mapped (shouldn't happen given the status filter)
    if (!payload) { skipped++; results.push({ id: record.id, name: record.name, status: 'SKIPPED', reason: 'No template' }); continue }

    try {
      const { templateName, components } = payload
      const apiResponse = await sendWhatsAppMessage(record.phone, templateName, components)
      const messageId   = apiResponse?.messages?.[0]?.id ?? null

      await prisma.khidmatRecord.update({
        where: { id: record.id },
        data:  {
          whatsappSent: true, whatsappSentAt: new Date(),
          whatsappMessageId: messageId, whatsappStatus: 'SENT',
          whatsappStatusUpdatedAt: new Date(), whatsappError: null
        }
      })

      sent++
      results.push({ id: record.id, name: record.name, phone: record.phone, status: 'SENT', messageId })

    } catch (error) {
      await prisma.khidmatRecord.update({
        where: { id: record.id },
        data:  {
          whatsappSent: false, whatsappStatus: 'FAILED',
          whatsappStatusUpdatedAt: new Date(), whatsappError: error.message
        }
      })

      failed++
      results.push({ id: record.id, name: record.name, phone: record.phone, status: 'FAILED', error: error.message })
    }

    // Rate-limit: ~3 messages/sec (Meta allows ~80/min on most tiers)
    await delay(350)
  }

  // Audit log for the entire bulk operation
  await createAuditLog({
    action:      'KHIDMAT_BULK_REMINDER_SENT',
    userId,
    userRole,
    entityType:  'KHIDMAT_RECORD',
    entityId:    'BULK',
    description: `Bulk reminder sent — ${sent} sent, ${failed} failed, ${skipped} skipped (statuses: ${statuses.join(', ')})`,
    metadata:    { statuses, filters, sent, failed, skipped, total: records.length },
    ipAddress
  })

  return { sent, failed, skipped, total: records.length, results }
}