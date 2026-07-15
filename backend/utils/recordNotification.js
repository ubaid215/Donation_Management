// ============================================================
// utils/recordNotification.js
// WhatsApp sender for KhidmatRecord
// Partial template now includes received + remaining amounts
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

// ─── Format helpers ──────────────────────────
const fmt = (val) =>
  parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

// ─────────────────────────────────────────────
// Build template payload per status
//
// Approved template names (configure in Meta Business Manager):
//   khidmat_completed  — vars: name, category, amount
//   khidmat_partial    — vars: name, category, receivedAmount, totalAmount, remainingAmount
//   khidmat_record     — vars: name, category
// ─────────────────────────────────────────────
// ─── Build template payload per status ──────────────────────
const buildTemplatePayload = (record, categoryName) => {
  const totalAmount = parseFloat(record.amount.toString())
  const receivedAmount = parseFloat(record.receivedAmount.toString())
  const remainingAmount = totalAmount - receivedAmount

  switch (record.status) {
    case 'COMPLETED':
      return {
        templateName: 'khidmat_completed',  // Must exist in Meta
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: `Rs ${fmt(totalAmount)}` },
            { type: 'text', text: categoryName },
          ]
        }]
      }

    case 'PARTIAL':
      return {
        templateName: 'khidmat_partial',  // Must exist in Meta
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName },
            { type: 'text', text: `Rs ${fmt(receivedAmount)}` },
            { type: 'text', text: `Rs ${fmt(totalAmount)}` },
            { type: 'text', text: `Rs ${fmt(remainingAmount)}` }
          ]
        }]
      }

    case 'RECORD_ONLY':
    default:
      return {
        templateName: 'khidmat_reminder_pending',  // Changed from khidmat_record
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName },
            { type: 'text', text: `Rs ${fmt(totalAmount)}` },
          ]
        }]
      }
  }
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export const sendKhidmatWhatsApp = async (recordId, userId, userRole, ipAddress = null) => {
  const record = await prisma.khidmatRecord.findUnique({
    where: { id: recordId },
    include: { category: { select: { name: true } } }
  })

  if (!record) throw new Error('KhidmatRecord not found')
  if (record.isDeleted) throw new Error('Cannot send WhatsApp for a deleted record')

  const categoryName = record.category?.name ?? 'General'
  const totalAmount = parseFloat(record.amount.toString())
  const receivedAmount = parseFloat(record.receivedAmount.toString())
  const remainingAmount = totalAmount - receivedAmount

  try {
    const { templateName, components } = buildTemplatePayload(record, categoryName)
    const apiResponse = await sendWhatsAppMessage(record.phone, templateName, components)
    const messageId = apiResponse?.messages?.[0]?.id ?? null

    await prisma.khidmatRecord.update({
      where: { id: recordId },
      data: {
        whatsappSent: true, whatsappSentAt: new Date(),
        whatsappMessageId: messageId, whatsappStatus: 'SENT',
        whatsappStatusUpdatedAt: new Date(), whatsappError: null
      }
    })

    await createAuditLog({
      action: 'KHIDMAT_WHATSAPP_SENT', userId, userRole,
      entityType: 'KHIDMAT_RECORD', entityId: recordId,
      description: `WhatsApp sent to ${record.name} (${record.phone}) — ${record.status}`,
      metadata: {
        phone: record.phone, status: record.status, templateName, messageId, categoryName,
        totalAmount, receivedAmount, remainingAmount
      },
      ipAddress
    })

    return { success: true, messageId }

  } catch (error) {
    await prisma.khidmatRecord.update({
      where: { id: recordId },
      data: {
        whatsappSent: false, whatsappStatus: 'FAILED',
        whatsappStatusUpdatedAt: new Date(), whatsappError: error.message
      }
    })

    await createAuditLog({
      action: 'KHIDMAT_WHATSAPP_FAILED', userId, userRole,
      entityType: 'KHIDMAT_RECORD', entityId: recordId,
      description: `WhatsApp FAILED for ${record.name} (${record.phone})`,
      metadata: { phone: record.phone, status: record.status, error: error.message },
      ipAddress
    })

    throw error
  }
}