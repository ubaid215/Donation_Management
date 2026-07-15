// ============================================================
// services/khidmat.service.js
// Add new methods
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

// ── Payments ──────────────────────────────────
export const addKhidmatPayment  = (id, data) => api.post(`/khidmat/${id}/payments`, data)
export const getKhidmatPayments = (id)       => api.get(`/khidmat/${id}/payments`)

// ── Person Routes ─────────────────────────────
export const getPersonPayments = (phone) => 
  api.get(`/khidmat/person/${encodeURIComponent(phone)}/payments`)

export const sendPersonWhatsApp = (phone, statusFilter) => {
  const params = statusFilter ? { statusFilter } : {}
  
  // Use undefined instead of null for better Axios compatibility
  return api.post(
    `/khidmat/person/${encodeURIComponent(phone)}/whatsapp`,
    undefined,  // or just omit the second parameter
    { params }
  )
}

// ── WhatsApp ──────────────────────────────────
export const sendKhidmatWhatsApp = (id) => api.post(`/khidmat/${id}/whatsapp`)

// ── Bulk Reminders ────────────────────────────
export const sendBulkReminders = async (payload = {}) => {
  try {
    const response = await api.post('/khidmat/bulk-reminders', payload)
    return response
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || 'Failed to send bulk reminders')
    }
    throw error
  }
}

export const previewBulkReminders = (params = {}) => 
  api.get('/khidmat/bulk-reminders/preview', { params })

// ── Scheduler ──────────────────────────────────
export const getSchedules = () => api.get('/khidmat/schedules')
export const createSchedule = (data) => api.post('/khidmat/schedules', data)
export const updateSchedule = (id, data) => api.put(`/khidmat/schedules/${id}`, data)
export const deleteSchedule = (id) => api.delete(`/khidmat/schedules/${id}`)
export const runSchedule = (id) => api.post(`/khidmat/schedules/${id}/run`)

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

export const getKhidmatByPerson = (params = {}) => api.get('/khidmat/by-person', { params })

export const downloadKhidmatByPersonReport = async (params = {}) => {
  const res = await api.get('/khidmat/reports/by-person', { params, responseType: 'blob' })
  const year = params.year || 'all'
  _trigger(res, `khidmat-by-person-${year}-${_today()}.pdf`)
}

export const downloadKhidmatPersonReport = async (phoneKey, name, params = {}) => {
  const res = await api.get(`/khidmat/reports/by-person/${encodeURIComponent(phoneKey)}`, {
    params, responseType: 'blob'
  })
  const safe = (name || 'person').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  _trigger(res, `khidmat-${safe}-${_today()}.pdf`)
}

const _today   = () => new Date().toISOString().split('T')[0]
const _trigger = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url; a.setAttribute('download', filename)
  document.body.appendChild(a); a.click(); a.remove()
  window.URL.revokeObjectURL(url)
}