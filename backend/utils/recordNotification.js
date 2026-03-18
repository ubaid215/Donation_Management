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
const buildTemplatePayload = (record, categoryName) => {
  const totalAmount    = parseFloat(record.amount.toString())
  const receivedAmount = parseFloat(record.receivedAmount.toString())
  const remainingAmount = totalAmount - receivedAmount

  switch (record.status) {

    case 'COMPLETED':
  return {
    templateName: 'khidmat_completed',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: record.name },                          // {{1}} name
        { type: 'text', text: `Rs ${fmt(totalAmount)}` },            // {{2}} payment amount
        { type: 'text', text: categoryName },                         // {{3}} purpose
        { type: 'text', text: new Date(record.date).toLocaleDateString('en-PK', {
            day: '2-digit', month: 'long', year: 'numeric'
          })
        },                                                            // {{4}} date
      ]
    }]
  }

    case 'PARTIAL':
      // Template body example:
      // "Assalaamu Alaikum {{1}}, your {{2}} khidmat payment of Rs {{3}}
      //  has been received. Total pledged: Rs {{4}}. Remaining: Rs {{5}}."
      return {
        templateName: 'khidmat_partial',
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName },
            { type: 'text', text: `Rs ${fmt(receivedAmount)}` },   // {{3}} received so far
            { type: 'text', text: `Rs ${fmt(totalAmount)}` },      // {{4}} total pledged
            { type: 'text', text: `Rs ${fmt(remainingAmount)}` }   // {{5}} remaining
          ]
        }]
      }

    case 'RECORD_ONLY':
    default:
      return {
        templateName: 'khidmat_record',
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: record.name },
            { type: 'text', text: categoryName }
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

  if (!record)            throw new Error('KhidmatRecord not found')
  if (record.isDeleted)   throw new Error('Cannot send WhatsApp for a deleted record')

  const categoryName = record.category?.name ?? 'General'
  const totalAmount    = parseFloat(record.amount.toString())
  const receivedAmount = parseFloat(record.receivedAmount.toString())
  const remainingAmount = totalAmount - receivedAmount

  try {
    const { templateName, components } = buildTemplatePayload(record, categoryName)
    const apiResponse = await sendWhatsAppMessage(record.phone, templateName, components)
    const messageId   = apiResponse?.messages?.[0]?.id ?? null

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