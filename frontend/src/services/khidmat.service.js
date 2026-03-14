// ============================================================
// services/khidmat.service.js
// All API calls for KhidmatRecord feature
// Uses the shared axios instance (api.js)
// ============================================================

import api from './api'

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

/**
 * Fetch paginated + filtered khidmat records
 * @param {object} params - { page, limit, status, categoryId, search, startDate, endDate }
 */
export const getKhidmatRecords = (params = {}) =>
  api.get('/khidmat', { params })

/**
 * Fetch a single record by ID
 */
export const getKhidmatRecord = (id) =>
  api.get(`/khidmat/${id}`)

/**
 * Create a new khidmat record
 * @param {object} data - { name, phone, address, amount, categoryId, status, notes, date }
 */
export const createKhidmatRecord = (data) =>
  api.post('/khidmat', data)

/**
 * Update an existing record
 */
export const updateKhidmatRecord = (id, data) =>
  api.put(`/khidmat/${id}`, data)

/**
 * Soft-delete a record
 */
export const deleteKhidmatRecord = (id, reason = '') =>
  api.delete(`/khidmat/${id}`, { data: { reason } })

/**
 * Restore a soft-deleted record (Admin only)
 */
export const restoreKhidmatRecord = (id) =>
  api.post(`/khidmat/${id}/restore`)

// ─────────────────────────────────────────────
// STATUS QUICK-UPDATE
// ─────────────────────────────────────────────

/**
 * Update only the status of a record
 * @param {'COMPLETED'|'PARTIAL'|'RECORD_ONLY'} status
 */
export const updateKhidmatStatus = (id, status) =>
  api.put(`/khidmat/${id}`, { status })

// ─────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────

/**
 * Trigger WhatsApp notification for a record (manual button click)
 */
export const sendKhidmatWhatsApp = (id) =>
  api.post(`/khidmat/${id}/whatsapp`)

// ─────────────────────────────────────────────
// STATS  (Admin)
// ─────────────────────────────────────────────

export const getKhidmatStats = (params = {}) =>
  api.get('/khidmat/stats', { params })

// ─────────────────────────────────────────────
// PDF REPORTS  (trigger file download)
// ─────────────────────────────────────────────

export const downloadKhidmatReport = async (params = {}) => {
  const response = await api.get('/khidmat/reports/full', {
    params,
    responseType: 'blob',
  })
  _triggerDownload(response, `khidmat-report-${_today()}.pdf`)
}

export const downloadKhidmatCategoryReport = async (categoryId, categoryName, params = {}) => {
  const response = await api.get('/khidmat/reports/category', {
    params: { categoryId, categoryName, ...params },
    responseType: 'blob',
  })
  const safeName = (categoryName || 'category').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  _triggerDownload(response, `khidmat-${safeName}-${_today()}.pdf`)
}

export const downloadKhidmatReceipt = async (id, name = 'receipt') => {
  const response = await api.get(`/khidmat/reports/receipt/${id}`, {
    responseType: 'blob',
  })
  const safeName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  _triggerDownload(response, `khidmat-receipt-${safeName}.pdf`)
}

// ─── internal helpers ────────────────────────
const _today = () => new Date().toISOString().split('T')[0]

const _triggerDownload = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}