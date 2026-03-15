// ============================================================
// services/khidmat.service.js
// ============================================================

import api from './api'

// ── CRUD ──────────────────────────────────────
export const getKhidmatRecords   = (params = {}) => api.get('/khidmat', { params })
export const getKhidmatRecord    = (id)           => api.get(`/khidmat/${id}`)
export const createKhidmatRecord = (data)         => api.post('/khidmat', data)
export const updateKhidmatRecord = (id, data)     => api.put(`/khidmat/${id}`, data)
export const updateKhidmatStatus = (id, status)   => api.put(`/khidmat/${id}`, { status })
export const deleteKhidmatRecord = (id, reason = '') =>
  api.delete(`/khidmat/${id}`, { data: { reason } })
export const restoreKhidmatRecord = (id) => api.post(`/khidmat/${id}/restore`)

// ── Payments / installments ───────────────────
/** Add a new installment: { amount, notes?, paidAt? } */
export const addKhidmatPayment  = (id, data) => api.post(`/khidmat/${id}/payments`, data)
/** Get full payment history for a record */
export const getKhidmatPayments = (id)       => api.get(`/khidmat/${id}/payments`)

// ── WhatsApp ──────────────────────────────────
export const sendKhidmatWhatsApp = (id) => api.post(`/khidmat/${id}/whatsapp`)

// ── Stats & Analytics ─────────────────────────
export const getKhidmatStats     = (params = {}) => api.get('/khidmat/stats',     { params })
export const getKhidmatAnalytics = (params = {}) => api.get('/khidmat/analytics', { params })

// ── PDF Reports ───────────────────────────────
export const downloadKhidmatReport = async (params = {}) => {
  const res = await api.get('/khidmat/reports/full', { params, responseType: 'blob' })
  _trigger(res, `khidmat-report-${_today()}.pdf`)
}

export const downloadKhidmatCategoryReport = async (categoryId, categoryName, params = {}) => {
  const res = await api.get('/khidmat/reports/category', {
    params: { categoryId, categoryName, ...params },
    responseType: 'blob'
  })
  const safe = (categoryName || 'category').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  _trigger(res, `khidmat-${safe}-${_today()}.pdf`)
}

export const downloadKhidmatReceipt = async (id, name = 'receipt') => {
  const res = await api.get(`/khidmat/reports/receipt/${id}`, { responseType: 'blob' })
  _trigger(res, `khidmat-receipt-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
}

const _today   = () => new Date().toISOString().split('T')[0]
const _trigger = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url; a.setAttribute('download', filename)
  document.body.appendChild(a); a.click(); a.remove()
  window.URL.revokeObjectURL(url)
}