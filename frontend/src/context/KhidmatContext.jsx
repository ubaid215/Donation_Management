<<<<<<< ours
/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
// ============================================================
// context/KhidmatContext.jsx
// ============================================================

=======
// ============================================================
// context/KhidmatContext.jsx
// FIXED: Removed duplicate applyFilters declaration
// ============================================================

/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
>>>>>>> theirs
import React, { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getKhidmatRecords, createKhidmatRecord, updateKhidmatRecord,
  updateKhidmatStatus, deleteKhidmatRecord, restoreKhidmatRecord,
  sendKhidmatWhatsApp, sendBulkReminders, previewBulkReminders,
  getKhidmatStats, getKhidmatAnalytics,
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

  // ── Bulk Reminders ────────────────────────────
  const [sendingBulk, setSendingBulk] = useState(false)
  const [bulkPreview, setBulkPreview] = useState(null)

  // ── Payment modal ─────────────────────────────
<<<<<<< ours
  const [paymentModalRecord, setPaymentModalRecord] = useState(null) // record to add payment to
  const [paymentHistory,     setPaymentHistory]     = useState({})   // { [recordId]: { payments, ... } }
=======
  const [paymentModalRecord, setPaymentModalRecord] = useState(null)
  const [paymentHistory,     setPaymentHistory]     = useState({})
>>>>>>> theirs

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
<<<<<<< ours
=======
  // APPLY FILTERS - Single declaration
  // ─────────────────────────────────────────────
  const applyFilters = useCallback((newFilters) => {
    const updated = { ...filters, ...newFilters, page: 1 }
    setFilters(updated)
    return updated
  }, [filters])

  // ─────────────────────────────────────────────
  // RESET FILTERS
  // ─────────────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    return DEFAULT_FILTERS
  }, [])

  // ─────────────────────────────────────────────
  // GO TO PAGE
  // ─────────────────────────────────────────────
  const goToPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  // ─────────────────────────────────────────────
>>>>>>> theirs
  // FETCH STATS
  // ─────────────────────────────────────────────
  const fetchStats = useCallback(async (params = {}) => {
    setStatsLoading(true)
    try {
      const data = await getKhidmatStats(params)
      setStats(data.stats)
<<<<<<< ours
    } catch (err) { console.error('Stats fetch failed:', err) }
    finally { setStatsLoading(false) }
=======
    } catch (err) { 
      console.error('Stats fetch failed:', err) 
    } finally { 
      setStatsLoading(false) 
    }
>>>>>>> theirs
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
<<<<<<< ours
    } finally { setAnalyticsLoading(false) }
=======
    } finally { 
      setAnalyticsLoading(false) 
    }
>>>>>>> theirs
  }, [])

  // ─────────────────────────────────────────────
  // BULK REMINDER PREVIEW
  // ─────────────────────────────────────────────
  const fetchBulkPreview = useCallback(async (previewFilters = {}) => {
    try {
      const params = {
        statuses: previewFilters.statuses?.join(',') || 'PARTIAL,RECORD_ONLY',
        ...(previewFilters.categoryId && { categoryId: previewFilters.categoryId }),
        ...(previewFilters.startDate && { startDate: previewFilters.startDate }),
        ...(previewFilters.endDate && { endDate: previewFilters.endDate }),
      }
      const data = await previewBulkReminders(params)
      setBulkPreview(data)
      return data
    } catch (err) {
      toast.error('Failed to preview reminders')
      return null
    }
  }, [])

<<<<<<< ours
// ─────────────────────────────────────────────
// SEND BULK REMINDERS (Updated with better error handling)
// ─────────────────────────────────────────────
const sendBulkReminderMessages = useCallback(async (options = {}) => {
  setSendingBulk(true)
  const toastId = toast.loading('Sending bulk reminders...')
  try {
    const payload = options.recordIds?.length
      ? { recordIds: options.recordIds }
      : {
          statuses: options.statuses || ['PARTIAL', 'RECORD_ONLY'],
          filters: {
            ...(options.categoryId && { categoryId: options.categoryId }),
            ...(options.startDate && { startDate: options.startDate }),
            ...(options.endDate && { endDate: options.endDate }),
          }
        }
    const result = await sendBulkReminders(payload)
    
    // Check if all failed due to template error
    const allFailed = result.sent === 0 && result.failed > 0
    const hasTemplateError = result.results?.some(r => 
      r.error?.toLowerCase().includes('template') || 
      r.error?.toLowerCase().includes('130472')
    )
    
    if (allFailed && hasTemplateError) {
      toast.error(
        'WhatsApp templates not configured. Please configure templates in Meta Business Manager first.',
        { id: toastId, duration: 6000 }
      )
    } else if (result.sent > 0 && result.failed > 0) {
      toast.success(
        `⚠️ Partial success: ${result.sent} sent, ${result.failed} failed. Check details below.`,
        { id: toastId, duration: 5000 }
      )
    } else if (result.sent > 0) {
      toast.success(
        `✅ All reminders sent! ${result.sent} messages delivered.`,
        { id: toastId, duration: 4000 }
      )
    } else if (result.failed > 0) {
      toast.error(
        `❌ All ${result.failed} reminders failed. ${hasTemplateError ? 'Template not configured.' : 'Check error details below.'}`,
        { id: toastId, duration: 5000 }
      )
    }
    
    // Refresh records to update WhatsApp statuses
    await fetchRecords()
    
    return result
  } catch (err) {
    // Check if it's a template error from the API response
    const errorMsg = err.message || ''
    const isTemplateError = 
      errorMsg.toLowerCase().includes('template') ||
      errorMsg.toLowerCase().includes('130472') ||
      errorMsg.toLowerCase().includes('not found')
    
    if (isTemplateError) {
      toast.error(
        'WhatsApp template not configured. Please configure it in Meta Business Manager before sending bulk reminders.',
        { id: toastId, duration: 6000 }
      )
    } else {
      toast.error(errorMsg || 'Failed to send bulk reminders', { id: toastId })
    }
    throw err
  } finally {
    setSendingBulk(false)
  }
}, [fetchRecords])

  // ─────────────────────────────────────────────
  // CREATE
=======
  // ─────────────────────────────────────────────
  // SEND BULK REMINDERS
  // ─────────────────────────────────────────────
  const sendBulkReminderMessages = useCallback(async (options = {}) => {
    setSendingBulk(true)
    const toastId = toast.loading('Sending bulk reminders...')
    try {
      const payload = options.recordIds?.length
        ? { recordIds: options.recordIds }
        : {
            statuses: options.statuses || ['PARTIAL', 'RECORD_ONLY'],
            filters: {
              ...(options.categoryId && { categoryId: options.categoryId }),
              ...(options.startDate && { startDate: options.startDate }),
              ...(options.endDate && { endDate: options.endDate }),
            }
          }
      const result = await sendBulkReminders(payload)
      
      // Check if all failed due to template error
      const allFailed = result.sent === 0 && result.failed > 0
      const hasTemplateError = result.results?.some(r => 
        r.error?.toLowerCase().includes('template') || 
        r.error?.toLowerCase().includes('130472')
      )
      
      if (allFailed && hasTemplateError) {
        toast.error(
          'WhatsApp templates not configured. Please configure templates in Meta Business Manager first.',
          { id: toastId, duration: 6000 }
        )
      } else if (result.sent > 0 && result.failed > 0) {
        toast.success(
          `⚠️ Partial success: ${result.sent} sent, ${result.failed} failed. Check details below.`,
          { id: toastId, duration: 5000 }
        )
      } else if (result.sent > 0) {
        toast.success(
          `✅ All reminders sent! ${result.sent} messages delivered.`,
          { id: toastId, duration: 4000 }
        )
      } else if (result.failed > 0) {
        toast.error(
          `❌ All ${result.failed} reminders failed. ${hasTemplateError ? 'Template not configured.' : 'Check error details below.'}`,
          { id: toastId, duration: 5000 }
        )
      }
      
      // Refresh records to update WhatsApp statuses
      await fetchRecords()
      
      return result
    } catch (err) {
      const errorMsg = err.message || ''
      const isTemplateError = 
        errorMsg.toLowerCase().includes('template') ||
        errorMsg.toLowerCase().includes('130472') ||
        errorMsg.toLowerCase().includes('not found')
      
      if (isTemplateError) {
        toast.error(
          'WhatsApp template not configured. Please configure it in Meta Business Manager before sending bulk reminders.',
          { id: toastId, duration: 6000 }
        )
      } else {
        toast.error(errorMsg || 'Failed to send bulk reminders', { id: toastId })
      }
      throw err
    } finally {
      setSendingBulk(false)
    }
  }, [fetchRecords])

  // ─────────────────────────────────────────────
  // CREATE RECORD
>>>>>>> theirs
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
<<<<<<< ours
      toast.error(err.message || 'Failed to create record', { id }); throw err
=======
      toast.error(err.message || 'Failed to create record', { id })
      throw err
>>>>>>> theirs
    }
  }, [fetchRecords])

  // ─────────────────────────────────────────────
<<<<<<< ours
  // UPDATE
=======
  // UPDATE RECORD
>>>>>>> theirs
  // ─────────────────────────────────────────────
  const updateRecord = useCallback(async (recordId, formData) => {
    const id = toast.loading('Updating record…')
    try {
      const data = await updateKhidmatRecord(recordId, formData)
      toast.success('Record updated!', { id })
<<<<<<< ours
      setShowForm(false); setEditingRecord(null)
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data.record } : r))
      return data.record
    } catch (err) {
      toast.error(err.message || 'Failed to update record', { id }); throw err
=======
      setShowForm(false)
      setEditingRecord(null)
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data.record } : r))
      return data.record
    } catch (err) {
      toast.error(err.message || 'Failed to update record', { id })
      throw err
>>>>>>> theirs
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
<<<<<<< ours
    } finally { setUpdatingStatus(prev => ({ ...prev, [recordId]: false })) }
  }, [])

  // ─────────────────────────────────────────────
  // ADD PAYMENT (installment)
=======
    } finally { 
      setUpdatingStatus(prev => ({ ...prev, [recordId]: false })) 
    }
  }, [])

  // ─────────────────────────────────────────────
  // ADD PAYMENT
>>>>>>> theirs
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
<<<<<<< ours
      // Update record in list with new totals + status
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data.record } : r))
      // Refresh payment history cache
=======
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...data.record } : r))
>>>>>>> theirs
      setPaymentHistory(prev => ({
        ...prev,
        [recordId]: {
          ...prev[recordId],
          payments:       [data.payment, ...(prev[recordId]?.payments || [])],
          receivedAmount: data.record.receivedAmount,
<<<<<<< ours
          remainingAmount:data.record.remainingAmount,
=======
          remainingAmount: data.record.remainingAmount,
>>>>>>> theirs
          status:         data.record.status
        }
      }))
      setPaymentModalRecord(null)
      return data
    } catch (err) {
<<<<<<< ours
      toast.error(err.message || 'Failed to record payment', { id }); throw err
    } finally { setAddingPayment(false) }
=======
      toast.error(err.message || 'Failed to record payment', { id })
      throw err
    } finally { 
      setAddingPayment(false) 
    }
>>>>>>> theirs
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
<<<<<<< ours
  // DELETE
=======
  // DELETE RECORD
>>>>>>> theirs
  // ─────────────────────────────────────────────
  const deleteRecord = useCallback(async (recordId, reason = '') => {
    const id = toast.loading('Deleting record…')
    try {
      await deleteKhidmatRecord(recordId, reason)
      toast.success('Record deleted', { id })
      setRecords(prev => prev.filter(r => r.id !== recordId))
    } catch (err) {
<<<<<<< ours
      toast.error(err.message || 'Failed to delete record', { id }); throw err
=======
      toast.error(err.message || 'Failed to delete record', { id })
      throw err
>>>>>>> theirs
    }
  }, [])

  // ─────────────────────────────────────────────
<<<<<<< ours
  // WHATSAPP
=======
  // SEND WHATSAPP
>>>>>>> theirs
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
<<<<<<< ours
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
=======
    } finally { 
      setSendingWhatsApp(prev => ({ ...prev, [recordId]: false })) 
    }
  }, [])

  // ─────────────────────────────────────────────
  // FORM HELPERS
  // ─────────────────────────────────────────────
  const openCreateForm = useCallback(() => { 
    setEditingRecord(null)
    setShowForm(true) 
  }, [])

  const openEditForm = useCallback((record) => { 
    setEditingRecord(record)
    setShowForm(true) 
  }, [])

  const closeForm = useCallback(() => { 
    setShowForm(false)
    setEditingRecord(null) 
  }, [])

  // ─────────────────────────────────────────────
  // PDF DOWNLOADS
>>>>>>> theirs
  // ─────────────────────────────────────────────
  const downloadReport = useCallback(async () => {
    const toastId = toast.loading('Generating PDF…')
    try {
      const { page, limit, ...f } = filters
      await downloadKhidmatReport(f)
      toast.success('Report downloaded!', { id: toastId })
<<<<<<< ours
    } catch { toast.error('Failed to generate report', { id: toastId }) }
=======
    } catch { 
      toast.error('Failed to generate report', { id: toastId }) 
    }
>>>>>>> theirs
  }, [filters])

  const downloadReceipt = useCallback(async (id, name) => {
    const toastId = toast.loading('Generating receipt…')
    try {
      await downloadKhidmatReceipt(id, name)
      toast.success('Receipt downloaded!', { id: toastId })
<<<<<<< ours
    } catch { toast.error('Failed to generate receipt', { id: toastId }) }
=======
    } catch { 
      toast.error('Failed to generate receipt', { id: toastId }) 
    }
>>>>>>> theirs
  }, [])

  // ─────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────
  const value = {
<<<<<<< ours
    records, pagination, filters, loading, error,
    stats, statsLoading,
    analytics, analyticsLoading,
    showForm, editingRecord,
    paymentModalRecord, setPaymentModalRecord,
    paymentHistory,
    sendingWhatsApp, updatingStatus, addingPayment,
    sendingBulk, bulkPreview,

    fetchRecords, fetchStats, fetchAnalytics,
    createRecord, updateRecord, quickUpdateStatus, deleteRecord,
    addPayment, fetchPaymentHistory,
    sendWhatsApp,
    fetchBulkPreview, sendBulkReminderMessages,

    applyFilters, resetFilters, goToPage,
    openCreateForm, openEditForm, closeForm,

    downloadReport, downloadReceipt, downloadKhidmatCategoryReport,
=======
    // State
    records,
    pagination,
    filters,
    loading,
    error,
    stats,
    statsLoading,
    analytics,
    analyticsLoading,
    showForm,
    editingRecord,
    paymentModalRecord,
    setPaymentModalRecord,
    paymentHistory,
    sendingWhatsApp,
    updatingStatus,
    addingPayment,
    sendingBulk,
    bulkPreview,

    // Fetch functions
    fetchRecords,
    fetchStats,
    fetchAnalytics,

    // CRUD operations
    createRecord,
    updateRecord,
    quickUpdateStatus,
    deleteRecord,

    // Payment operations
    addPayment,
    fetchPaymentHistory,

    // WhatsApp operations
    sendWhatsApp,
    fetchBulkPreview,
    sendBulkReminderMessages,

    // Filter operations
    applyFilters,
    resetFilters,
    goToPage,

    // Form operations
    openCreateForm,
    openEditForm,
    closeForm,

    // PDF operations
    downloadReport,
    downloadReceipt,
    downloadKhidmatCategoryReport,
>>>>>>> theirs
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