// ============================================================
// utils/recordNotification.js
// WhatsApp notification helper for KhidmatRecord
//
// Sends a status-specific message to the person's phone.
// Called manually from the frontend (button click) via
//   POST /api/khidmat/:id/whatsapp
// ============================================================

import prisma from '../config/prisma.js';
import { createAuditLog } from './auditLogger.js';

// ─────────────────────────────────────────────
// WhatsApp API wrapper
// Reads WHATSAPP_API_URL, WHATSAPP_PHONE_NUMBER_ID,
// and WHATSAPP_ACCESS_TOKEN from environment.
// ─────────────────────────────────────────────
const sendWhatsAppMessage = async (toPhone, templateName, components = []) => {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error ${response.status}: ${JSON.stringify(errorBody)}`
    );
  }

  return response.json(); // { messages: [{ id: "wamid.xxx" }] }
};

// ─────────────────────────────────────────────
// Build template components per status
//
// Template names should be pre-approved in Meta Business Manager.
// Adjust template names / variables to match your approved templates.
// ─────────────────────────────────────────────
const buildTemplatePayload = (record, categoryName) => {
  const amountStr = parseFloat(record.amount.toString()).toLocaleString('ur-PK');

  switch (record.status) {
    // ── Fully completed service ──────────────
    case 'COMPLETED':
      return {
        templateName: 'khidmat_completed',          // ← your approved template name
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: record.name },
              { type: 'text', text: categoryName },
              { type: 'text', text: amountStr }
            ]
          }
        ]
      };

    // ── Partially completed service ──────────
    case 'PARTIAL':
      return {
        templateName: 'khidmat_partial',             // ← your approved template name
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: record.name },
              { type: 'text', text: categoryName },
              { type: 'text', text: amountStr }
            ]
          }
        ]
      };

    // ── Record only — no service yet ─────────
    case 'RECORD_ONLY':
    default:
      return {
        templateName: 'khidmat_record',              // ← your approved template name
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: record.name },
              { type: 'text', text: categoryName }
            ]
          }
        ]
      };
  }
};

// ─────────────────────────────────────────────
// Main exported function
// Sends a WhatsApp message for a given KhidmatRecord
// and updates the record + audit log accordingly.
//
// @param {string} recordId  - KhidmatRecord UUID
// @param {string} userId    - Operator/Admin UUID (from req.user.id)
// @param {string} userRole  - 'ADMIN' | 'OPERATOR'
// @param {string} ipAddress - Request IP
// @returns {object}         - { success, messageId?, error? }
// ─────────────────────────────────────────────
export const sendKhidmatWhatsApp = async (
  recordId,
  userId,
  userRole,
  ipAddress = null
) => {
  // ── 1. Fetch the record with category ───────
  const record = await prisma.khidmatRecord.findUnique({
    where: { id: recordId },
    include: {
      category: { select: { name: true } }
    }
  });

  if (!record) {
    throw new Error('KhidmatRecord not found');
  }

  if (record.isDeleted) {
    throw new Error('Cannot send WhatsApp message for a deleted record');
  }

  const categoryName = record.category?.name ?? 'General';

  try {
    // ── 2. Build status-specific template ───────
    const { templateName, components } = buildTemplatePayload(record, categoryName);

    // ── 3. Send via WhatsApp Cloud API ──────────
    const apiResponse = await sendWhatsAppMessage(record.phone, templateName, components);
    const messageId = apiResponse?.messages?.[0]?.id ?? null;

    // ── 4. Update record — mark sent ─────────────
    await prisma.khidmatRecord.update({
      where: { id: recordId },
      data: {
        whatsappSent: true,
        whatsappSentAt: new Date(),
        whatsappMessageId: messageId,
        whatsappStatus: 'SENT',
        whatsappStatusUpdatedAt: new Date(),
        whatsappError: null
      }
    });

    // ── 5. Audit log — success ───────────────────
    await createAuditLog({
      action: 'KHIDMAT_WHATSAPP_SENT',
      userId,
      userRole,
      entityType: 'KHIDMAT_RECORD',
      entityId: recordId,
      description: `WhatsApp notification sent to ${record.name} (${record.phone}) for khidmat record`,
      metadata: {
        phone: record.phone,
        status: record.status,
        templateName,
        messageId,
        categoryName
      },
      ipAddress
    });

    return { success: true, messageId };

  } catch (error) {
    // ── 6. Update record — mark failed ───────────
    await prisma.khidmatRecord.update({
      where: { id: recordId },
      data: {
        whatsappSent: false,
        whatsappStatus: 'FAILED',
        whatsappStatusUpdatedAt: new Date(),
        whatsappError: error.message
      }
    });

    // ── 7. Audit log — failure ───────────────────
    await createAuditLog({
      action: 'KHIDMAT_WHATSAPP_FAILED',
      userId,
      userRole,
      entityType: 'KHIDMAT_RECORD',
      entityId: recordId,
      description: `WhatsApp notification FAILED for ${record.name} (${record.phone})`,
      metadata: {
        phone: record.phone,
        status: record.status,
        error: error.message
      },
      ipAddress
    });

    // Re-throw so caller can return a proper HTTP error
    throw error;
  }
};