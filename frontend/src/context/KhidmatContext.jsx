/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
// ============================================================
// context/KhidmatContext.jsx
// Global state for KhidmatRecord — mirrors DonationContext pattern
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getKhidmatRecords,
  createKhidmatRecord,
  updateKhidmatRecord,
  updateKhidmatStatus,
  deleteKhidmatRecord,
  restoreKhidmatRecord,
  sendKhidmatWhatsApp,
  getKhidmatStats,
  downloadKhidmatReport,
  downloadKhidmatCategoryReport,
  downloadKhidmatReceipt,
} from '../services/khidmat.service'

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const KhidmatContext = createContext(null)

// ─────────────────────────────────────────────
// Default filter state
// ─────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search:     '',
  status:     '',
  categoryId: '',
  startDate:  '',
  endDate:    '',
  page:       1,
  limit:      20,
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const KhidmatProvider = ({ children }) => {
  // ── Records list state ───────────────────────
  const [records,    setRecords]    = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  // ── Stats state ──────────────────────────────
  const [stats,      setStats]      = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // ── Modal / selected record state ────────────
  const [selectedRecord,  setSelectedRecord]  = useState(null)
  const [showForm,        setShowForm]        = useState(false)
  const [editingRecord,   setEditingRecord]   = useState(null)

  // ── WhatsApp sending tracker (recordId → bool) ─
  const [sendingWhatsApp, setSendingWhatsApp] = useState({})
  const [updatingStatus,  setUpdatingStatus]  = useState({})

  // ─────────────────────────────────────────────
  // FETCH RECORDS
  // ─────────────────────────────────────────────
  const fetchRecords = useCallback(async (overrideFilters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = { ...filters, ...overrideFilters }
      // Strip empty values so URL stays clean
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const data = await getKhidmatRecords(clean)
      setRecords(data.records || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
    } catch (err) {
      setError(err.message || 'Failed to fetch records')
      toast.error(err.message || 'Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // ─────────────────────────────────────────────
  // FETCH STATS
  // ─────────────────────────────────────────────
  const fetchStats = useCallback(async (params = {}) => {
    setStatsLoading(true)
    try {
      const data = await getKhidmatStats(params)
      setStats(data.stats)
    } catch (err) {
      // Stats are non-critical — silent fail
      console.error('Failed to fetch khidmat stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  const createRecord = useCallback(async (formData) => {
    const toastId = toast.loading('Creating record…')
    try {
      const data = await createKhidmatRecord(formData)
      toast.success('Khidmat record created!', { id: toastId })
      setShowForm(false)
      await fetchRecords()
      return data.record
    } catch (err) {
      toast.error(err.message || 'Failed to create record', { id: toastId })
      throw err
    }
  }, [fetchRecords])

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  const updateRecord = useCallback(async (id, formData) => {
    const toastId = toast.loading('Updating record…')
    try {
      const data = await updateKhidmatRecord(id, formData)
      toast.success('Record updated!', { id: toastId })
      setShowForm(false)
      setEditingRecord(null)
      // Optimistic update in list
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...data.record } : r))
      return data.record
    } catch (err) {
      toast.error(err.message || 'Failed to update record', { id: toastId })
      throw err
    }
  }, [])

  // ─────────────────────────────────────────────
  // QUICK STATUS UPDATE  (inline from table)
  // ─────────────────────────────────────────────
  const quickUpdateStatus = useCallback(async (id, status) => {
    setUpdatingStatus(prev => ({ ...prev, [id]: true }))
    try {
      await updateKhidmatStatus(id, status)
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(`Status updated to ${STATUS_LABELS[status]}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }))
    }
  }, [])

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────
  const deleteRecord = useCallback(async (id, reason = '') => {
    const toastId = toast.loading('Deleting record…')
    try {
      await deleteKhidmatRecord(id, reason)
      toast.success('Record deleted', { id: toastId })
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      toast.error(err.message || 'Failed to delete record', { id: toastId })
      throw err
    }
  }, [])

  // ─────────────────────────────────────────────
  // WHATSAPP SEND
  // ─────────────────────────────────────────────
  const sendWhatsApp = useCallback(async (id) => {
    setSendingWhatsApp(prev => ({ ...prev, [id]: true }))
    const toastId = toast.loading('Sending WhatsApp message…')
    try {
      await sendKhidmatWhatsApp(id)
      toast.success('WhatsApp message sent!', { id: toastId })
      // Optimistically update whatsappSent flag
      setRecords(prev => prev.map(r =>
        r.id === id ? { ...r, whatsappSent: true, whatsappStatus: 'SENT' } : r
      ))
    } catch (err) {
      // Distinguish "template not configured" from other errors
      const msg = err.message || ''
      if (
        msg.toLowerCase().includes('template') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('130472') // Meta error code for invalid template
      ) {
        toast.error('WhatsApp template not defined. Please configure it in Meta Business Manager.', {
          id: toastId,
          duration: 5000,
        })
      } else {
        toast.error(msg || 'Failed to send WhatsApp message', { id: toastId })
      }
    } finally {
      setSendingWhatsApp(prev => ({ ...prev, [id]: false }))
    }
  }, [])

  // ─────────────────────────────────────────────
  // FILTER HELPERS
  // ─────────────────────────────────────────────
  const applyFilters = useCallback((newFilters) => {
    const updated = { ...filters, ...newFilters, page: 1 }
    setFilters(updated)
    // fetchRecords will be triggered by useEffect in the page component
    return updated
  }, [filters])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const goToPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }))
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
  // ─────────────────────────────────────────────
  const downloadReport = useCallback(async () => {
    const toastId = toast.loading('Generating PDF…')
    try {
      // Pass current active filters (strip pagination)
      const { page, limit, ...reportFilters } = filters
      await downloadKhidmatReport(reportFilters)
      toast.success('Report downloaded!', { id: toastId })
    } catch (err) {
      toast.error('Failed to generate report', { id: toastId })
    }
  }, [filters])

  const downloadReceipt = useCallback(async (id, name) => {
    const toastId = toast.loading('Generating receipt…')
    try {
      await downloadKhidmatReceipt(id, name)
      toast.success('Receipt downloaded!', { id: toastId })
    } catch (err) {
      toast.error('Failed to generate receipt', { id: toastId })
    }
  }, [])

  // ─────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────
  const value = {
    // State
    records,
    pagination,
    filters,
    loading,
    error,
    stats,
    statsLoading,
    showForm,
    editingRecord,
    selectedRecord,
    sendingWhatsApp,
    updatingStatus,

    // Actions
    fetchRecords,
    fetchStats,
    createRecord,
    updateRecord,
    quickUpdateStatus,
    deleteRecord,
    sendWhatsApp,

    // Filter helpers
    applyFilters,
    resetFilters,
    goToPage,

    // Form helpers
    openCreateForm,
    openEditForm,
    closeForm,
    setSelectedRecord,

    // PDF
    downloadReport,
    downloadReceipt,
    downloadKhidmatCategoryReport,
  }

  return (
    <KhidmatContext.Provider value={value}>
      {children}
    </KhidmatContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export const useKhidmat = () => {
  const ctx = useContext(KhidmatContext)
  if (!ctx) throw new Error('useKhidmat must be used inside <KhidmatProvider>')
  return ctx
}

// ─────────────────────────────────────────────
// Shared constants (used across components)
// ─────────────────────────────────────────────
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