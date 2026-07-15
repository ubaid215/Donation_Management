// ============================================================
// components/khidmat/SchedulerManager.jsx
// FIXED - Time display with proper timezone handling
// ============================================================

import React, { useState, useEffect } from 'react'
import { 
  Clock, Plus, Trash2, Edit2, Play, Pause, 
  Calendar, Users, MessageCircle, Loader2, X, Filter 
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getSchedules, createSchedule, updateSchedule, 
  deleteSchedule, runSchedule 
} from '../../services/khidmat.service'
import { useKhidmat } from '../../context/KhidmatContext'
import { useDonations } from '../../context/DonationContext'

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'CUSTOM', label: 'Custom' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'RECORD_ONLY', label: 'Record Only' },
  { value: 'COMPLETED', label: 'Completed' },
]

// ─── Helper: Format time for display ──────────
const formatTimeForDisplay = (dateString) => {
  if (!dateString) return 'Not scheduled'
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date'
    // Format in local timezone with AM/PM
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (e) {
    return 'Invalid date'
  }
}

// ─── Helper: Format time for input ────────────
const formatTimeForInput = (timeString) => {
  if (!timeString) return '09:00'
  // If it's already in HH:mm format, return it
  if (/^\d{2}:\d{2}$/.test(timeString)) return timeString
  try {
    const date = new Date(timeString)
    if (isNaN(date.getTime())) return '09:00'
    return date.toTimeString().slice(0, 5)
  } catch (e) {
    return '09:00'
  }
}

const SchedulerManager = () => {
  const { records } = useKhidmat()
  const { activeCategories } = useDonations()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [running, setRunning] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'DAILY',
    time: '09:00',
    recordIds: [],
    isActive: true,
    filterStatuses: ['PARTIAL', 'RECORD_ONLY'],
    filterCategoryId: '',
  })
  const [selectedRecords, setSelectedRecords] = useState([])
  const [filterStatuses, setFilterStatuses] = useState(['PARTIAL', 'RECORD_ONLY'])
  const [filterCategoryId, setFilterCategoryId] = useState('')

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await getSchedules()
      setSchedules(data.schedules || [])
    } catch (err) {
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSchedules() }, [])

  const handleRun = async (id) => {
    setRunning(id)
    try {
      const result = await runSchedule(id)
      toast.success(`Run completed: ${result.sent} sent, ${result.failed} failed`)
      await loadSchedules()
    } catch (err) {
      toast.error(err.message || 'Failed to run schedule')
    } finally {
      setRunning(null)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete schedule "${name}"?`)) return
    try {
      await deleteSchedule(id)
      toast.success('Schedule deleted')
      await loadSchedules()
    } catch (err) {
      toast.error('Failed to delete schedule')
    }
  }

  const handleToggleStatus = async (schedule) => {
    try {
      await updateSchedule(schedule.id, { isActive: !schedule.isActive })
      toast.success(schedule.isActive ? 'Schedule paused' : 'Schedule resumed')
      await loadSchedules()
    } catch (err) {
      toast.error('Failed to update schedule')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Schedule name is required')
      return
    }
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one record')
      return
    }

    setLoading(true)
    try {
      const data = { 
        ...formData, 
        recordIds: selectedRecords,
        filterStatuses,
        filterCategoryId: filterCategoryId || null,
      }
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data)
        toast.success('Schedule updated')
      } else {
        await createSchedule(data)
        toast.success('Schedule created')
      }
      setShowForm(false)
      setEditingSchedule(null)
      setSelectedRecords([])
      setFilterStatuses(['PARTIAL', 'RECORD_ONLY'])
      setFilterCategoryId('')
      setFormData({ 
        name: '', 
        frequency: 'DAILY', 
        time: '09:00',
        recordIds: [], 
        isActive: true,
        filterStatuses: ['PARTIAL', 'RECORD_ONLY'],
        filterCategoryId: '',
      })
      await loadSchedules()
    } catch (err) {
      toast.error(err.message || 'Failed to save schedule')
    } finally {
      setLoading(false)
    }
  }

  const toggleRecord = (id) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const toggleFilterStatus = (status) => {
    setFilterStatuses(prev =>
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    )
  }

  const openEditForm = (schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      frequency: schedule.frequency,
      time: formatTimeForInput(schedule.time),
      recordIds: schedule.records?.map(r => r.recordId) || [],
      isActive: schedule.isActive,
      filterStatuses: schedule.filterStatuses || ['PARTIAL', 'RECORD_ONLY'],
      filterCategoryId: schedule.filterCategoryId || '',
    })
    setSelectedRecords(schedule.records?.map(r => r.recordId) || [])
    setFilterStatuses(schedule.filterStatuses || ['PARTIAL', 'RECORD_ONLY'])
    setFilterCategoryId(schedule.filterCategoryId || '')
    setShowForm(true)
  }

  const openCreateForm = () => {
    setEditingSchedule(null)
    setFormData({ 
      name: '', 
      frequency: 'DAILY', 
      time: '09:00',
      recordIds: [], 
      isActive: true,
      filterStatuses: ['PARTIAL', 'RECORD_ONLY'],
      filterCategoryId: '',
    })
    setSelectedRecords([])
    setFilterStatuses(['PARTIAL', 'RECORD_ONLY'])
    setFilterCategoryId('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSchedule(null)
    setSelectedRecords([])
  }

  // Filter records based on selected statuses and category
  const filteredRecords = records.filter(record => {
    if (filterStatuses.length > 0 && !filterStatuses.includes(record.status)) {
      return false
    }
    if (filterCategoryId && record.categoryId !== filterCategoryId) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-700" size={20} />
          <h2 className="text-lg font-bold text-slate-800">Reminder Schedules</h2>
          <span className="text-xs text-slate-400">
            {loading ? 'Loading...' : `${schedules.length} schedules`}
          </span>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
        >
          <Plus size={15} /> New Schedule
        </button>
      </div>

      {/* Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map(schedule => (
          <div key={schedule.id} 
            className={`bg-white rounded-2xl border p-4 shadow-sm transition-all
              ${schedule.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-800">{schedule.name}</h3>
                <p className="text-xs text-slate-400">
                  {schedule.frequency} at {schedule.time || '09:00'} · {schedule.recordCount || 0} records
                </p>
                {schedule.filterCategoryId && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    Category: {activeCategories.find(c => c.id === schedule.filterCategoryId)?.name || 'Unknown'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {schedule.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {schedule.records?.slice(0, 5).map(r => (
                <span key={r.recordId} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {r.record?.name || 'Unknown'}
                </span>
              ))}
              {schedule.recordCount > 5 && (
                <span className="text-xs text-slate-400">+{schedule.recordCount - 5} more</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                {schedule.nextRunAt ? (
                  <>
                    Next: {formatTimeForDisplay(schedule.nextRunAt)}
                  </>
                ) : (
                  'Not scheduled'
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleStatus(schedule)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title={schedule.isActive ? 'Pause' : 'Resume'}
                >
                  {schedule.isActive ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => handleRun(schedule.id)}
                  disabled={running === schedule.id}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                  title="Run now"
                >
                  {running === schedule.id 
                    ? <Loader2 size={14} className="animate-spin" />
                    : <MessageCircle size={14} />
                  }
                </button>
                <button
                  onClick={() => openEditForm(schedule)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id, schedule.name)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-700 shrink-0">
              <div>
                <h2 className="text-white font-semibold">
                  {editingSchedule ? 'Edit Schedule' : 'New Reminder Schedule'}
                </h2>
                <p className="text-blue-200 text-xs">
                  Schedule automated WhatsApp reminders with time and filters
                </p>
              </div>
              <button onClick={closeForm} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Partial Reminders"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Frequency & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time (24h)
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Enter time in 24-hour format (e.g., 23:00 for 11 PM)</p>
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filters</span>
                </div>

                {/* Status Filters */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Statuses to Include
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FILTER_OPTIONS.map(opt => {
                      const active = filterStatuses.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleFilterStatus(opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${active 
                              ? 'bg-blue-700 text-white border-blue-700' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={filterCategoryId}
                    onChange={e => setFilterCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">All Categories</option>
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Record Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Records ({selectedRecords.length} selected)
                </label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y">
                  {filteredRecords.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">
                      No records match the selected filters
                    </p>
                  ) : (
                    filteredRecords.map(record => (
                      <label key={record.id} 
                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={() => toggleRecord(record.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{record.name}</p>
                          <p className="text-xs text-slate-400">{record.phone}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            record.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'}`}>
                          {record.status}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Active (will run automatically)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || filteredRecords.length === 0}
                  className="flex-1 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    editingSchedule ? 'Update Schedule' : 'Create Schedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchedulerManager