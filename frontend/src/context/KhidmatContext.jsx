/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
// ============================================================
// context/KhidmatContext.jsx
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getKhidmatRecords, createKhidmatRecord, updateKhidmatRecord,
  updateKhidmatStatus, deleteKhidmatRecord, restoreKhidmatRecord,
  sendKhidmatWhatsApp, getKhidmatStats, getKhidmatAnalytics,
  addKhidmatPayment, getKhidmatPayments,
  downloadKhidmatReport, downloadKhidmatCategoryReport, downloadKhidmatReceipt,
} from '../services/khidmat.service'

const KhidmatContext = createContext(null)

const DEFAULT_FILTERS = {
  search: '', status: '', categoryId: '',
  startDate: '', endDate: '', page: 1, limit: 20,
}

export const KhidmatProvider = ({ children }) => {
  // ── Records list ─────────────────────────────
  const [records,    setRecords]    = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  // ── Stats ─────────────────────────────────────
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // ── Analytics ─────────────────────────────────
  const [analytics,        setAnalytics]        = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // ── Payment modal ─────────────────────────────
  const [paymentModalRecord, setPaymentModalRecord] = useState(null) // record to add payment to
  const [paymentHistory,     setPaymentHistory]     = useState({})   // { [recordId]: { payments, ... } }

  // ── Form ──────────────────────────────────────
  const [showForm,      setShowForm]      = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  // ── Loading trackers ──────────────────────────
  const [sendingWhatsApp, setSendingWhatsApp] = useState({})
  const [updatingStatus,  setUpdatingStatus]  = useState({})
  const [addingPayment,   setAddingPayment]   = useState(false)

  // ─────────────────────────────────────────────
  // FETCH RECORDS
  // ─────────────────────────────────────────────
  const fetchRecords = useCallback(async (overrideFilters = {}) => {
    setLoading(true); setError(null)
    try {
      const params = { ...filters, ...overrideFilters }
      const clean  = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)
      )
      const data = await getKhidmatRecords(clean)
      setRecords(data.records || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
    } catch (err) {
      setError(err.message || 'Failed to fetch records')
      toast.error(err.message || 'Failed to fetch records')
    } finally { setLoading(false) }
  }, [filters])

  // ─────────────────────────────────────────────
  // FETCH STATS
  // ─────────────────────────────────────────────
  const fetchStats = useCallback(async (params = {}) => {
    setStatsLoading(true)
    try {
      const data = await getKhidmatStats(params)
      setStats(data.stats)
    } catch (err) { console.error('Stats fetch failed:', err) }
    finally { setStatsLoading(false) }
  }, [])

  // ─────────────────────────────────────────────
  // FETCH ANALYTICS
  // ─────────────────────────────────────────────
  const fetchAnalytics = useCallback(async (params = {}) => {
    setAnalyticsLoading(true)
    try {
      const data = await getKhidmatAnalytics(params)
      setAnalytics({ monthlyTrend: data.monthlyTrend, byCategory: data.byCategory })
    } catch (err) {
      console.error('Analytics fetch failed:', err)
      toast.error('Failed to load analytics')
    } finally { setAnalyticsLoading(false) }
  }, [])

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  const createRecord = useCallback(async (formData) => {
    const id = toast.loading('Creating record…')
    try {
      const data = await createKhidmatRecord(formData)
      toast.success('Khidmat record created!', { id })
      setShowForm(false)
      await fetchRecords()
      return data.record
    } catch (err) {
      toast.error(err.message || 'Failed to create record', { id }); throw err
    }
  }, [fetchRecords])

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  const updateRecord = useCallback(async (recordId, formData) => {
    const id = toast.loading('Updating record…')
    try {
      const data = await updateKhidmatRecord(recordId, formData)
      toast.success('Record updated!', { id })
      setShowForm(false); setEditingRecord(null)
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data.record } : r))
      return data.record
    } catch (err) {
      toast.error(err.message || 'Failed to update record', { id }); throw err
    }
  }, [])

  // ─────────────────────────────────────────────
  // QUICK STATUS UPDATE
  // ─────────────────────────────────────────────
  const quickUpdateStatus = useCallback(async (recordId, status) => {
    setUpdatingStatus(prev => ({ ...prev, [recordId]: true }))
    try {
      await updateKhidmatStatus(recordId, status)
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status } : r))
      toast.success(`Status updated to ${STATUS_LABELS[status]}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    } finally { setUpdatingStatus(prev => ({ ...prev, [recordId]: false })) }
  }, [])

  // ─────────────────────────────────────────────
  // ADD PAYMENT (installment)
  // ─────────────────────────────────────────────
  const addPayment = useCallback(async (recordId, paymentData) => {
    setAddingPayment(true)
    const id = toast.loading('Recording payment…')
    try {
      const data = await addKhidmatPayment(recordId, paymentData)
      toast.success(
        `Rs ${data.payment.amount} recorded — ${data.record.receivedAmount} / ${data.record.amount} received`,
        { id, duration: 4000 }
      )
      // Update record in list with new totals + status
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data.record } : r))
      // Refresh payment history cache
      setPaymentHistory(prev => ({
        ...prev,
        [recordId]: {
          ...prev[recordId],
          payments:       [data.payment, ...(prev[recordId]?.payments || [])],
          receivedAmount: data.record.receivedAmount,
          remainingAmount:data.record.remainingAmount,
          status:         data.record.status
        }
      }))
      setPaymentModalRecord(null)
      return data
    } catch (err) {
      toast.error(err.message || 'Failed to record payment', { id }); throw err
    } finally { setAddingPayment(false) }
  }, [])

  // ─────────────────────────────────────────────
  // FETCH PAYMENT HISTORY
  // ─────────────────────────────────────────────
  const fetchPaymentHistory = useCallback(async (recordId) => {
    try {
      const data = await getKhidmatPayments(recordId)
      setPaymentHistory(prev => ({ ...prev, [recordId]: data }))
      return data
    } catch (err) {
      toast.error('Failed to load payment history')
      return null
    }
  }, [])

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────
  const deleteRecord = useCallback(async (recordId, reason = '') => {
    const id = toast.loading('Deleting record…')
    try {
      await deleteKhidmatRecord(recordId, reason)
      toast.success('Record deleted', { id })
      setRecords(prev => prev.filter(r => r.id !== recordId))
    } catch (err) {
      toast.error(err.message || 'Failed to delete record', { id }); throw err
    }
  }, [])

  // ─────────────────────────────────────────────
  // WHATSAPP
  // ─────────────────────────────────────────────
  const sendWhatsApp = useCallback(async (recordId) => {
    setSendingWhatsApp(prev => ({ ...prev, [recordId]: true }))
    const id = toast.loading('Sending WhatsApp message…')
    try {
      await sendKhidmatWhatsApp(recordId)
      toast.success('WhatsApp message sent!', { id })
      setRecords(prev => prev.map(r =>
        r.id === recordId ? { ...r, whatsappSent: true, whatsappStatus: 'SENT' } : r
      ))
    } catch (err) {
      const msg = err.message || ''
      const isTemplateError =
        msg.toLowerCase().includes('template') ||
        msg.toLowerCase().includes('130472') ||
        msg.toLowerCase().includes('not found')
      toast.error(
        isTemplateError
          ? 'WhatsApp template not defined. Please configure it in Meta Business Manager.'
          : msg || 'Failed to send WhatsApp message',
        { id, duration: 5000 }
      )
    } finally { setSendingWhatsApp(prev => ({ ...prev, [recordId]: false })) }
  }, [])

  // ─────────────────────────────────────────────
  // FILTER HELPERS
  // ─────────────────────────────────────────────
  const applyFilters = useCallback((newFilters) => {
    const updated = { ...filters, ...newFilters, page: 1 }
    setFilters(updated); return updated
  }, [filters])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])
  const goToPage     = useCallback((page) => setFilters(prev => ({ ...prev, page })), [])

  // ─────────────────────────────────────────────
  // FORM HELPERS
  // ─────────────────────────────────────────────
  const openCreateForm = useCallback(() => { setEditingRecord(null); setShowForm(true) }, [])
  const openEditForm   = useCallback((record) => { setEditingRecord(record); setShowForm(true) }, [])
  const closeForm      = useCallback(() => { setShowForm(false); setEditingRecord(null) }, [])

  // ─────────────────────────────────────────────
  // PDF
  // ─────────────────────────────────────────────
  const downloadReport = useCallback(async () => {
    const toastId = toast.loading('Generating PDF…')
    try {
      const { page, limit, ...f } = filters
      await downloadKhidmatReport(f)
      toast.success('Report downloaded!', { id: toastId })
    } catch { toast.error('Failed to generate report', { id: toastId }) }
  }, [filters])

  const downloadReceipt = useCallback(async (id, name) => {
    const toastId = toast.loading('Generating receipt…')
    try {
      await downloadKhidmatReceipt(id, name)
      toast.success('Receipt downloaded!', { id: toastId })
    } catch { toast.error('Failed to generate receipt', { id: toastId }) }
  }, [])

  // ─────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────
  const value = {
    records, pagination, filters, loading, error,
    stats, statsLoading,
    analytics, analyticsLoading,
    showForm, editingRecord,
    paymentModalRecord, setPaymentModalRecord,
    paymentHistory,
    sendingWhatsApp, updatingStatus, addingPayment,

    fetchRecords, fetchStats, fetchAnalytics,
    createRecord, updateRecord, quickUpdateStatus, deleteRecord,
    addPayment, fetchPaymentHistory,
    sendWhatsApp,

    applyFilters, resetFilters, goToPage,
    openCreateForm, openEditForm, closeForm,

    downloadReport, downloadReceipt, downloadKhidmatCategoryReport,
  }

  return <KhidmatContext.Provider value={value}>{children}</KhidmatContext.Provider>
}

export const useKhidmat = () => {
  const ctx = useContext(KhidmatContext)
  if (!ctx) throw new Error('useKhidmat must be used inside <KhidmatProvider>')
  return ctx
}

export const STATUS_LABELS = {
  COMPLETED:   'Completed',
  PARTIAL:     'Partial',
  RECORD_ONLY: 'Record Only',
}

export const STATUS_COLORS = {
  COMPLETED:   { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  PARTIAL:     { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  RECORD_ONLY: { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
}

export default KhidmatContext