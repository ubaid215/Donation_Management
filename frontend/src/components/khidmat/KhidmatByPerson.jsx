// ============================================================
// components/khidmat/KhidmatByPerson.jsx
// Yearly view grouped by person with search, filters, PDF
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  ChevronDown, ChevronRight, FileDown, Loader2,
  User, Phone, MapPin, Calendar, AlertCircle, CheckCircle2, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useKhidmat, STATUS_LABELS, STATUS_COLORS } from '../../context/KhidmatContext'
import KhidmatFilter from './KhidmatFilter'
import BulkReminderBar from './BulkReminderBar'
import { getCategoryUrdu } from '../../utils/categoryDisplay'
import { urduClass } from '../../utils/urdu'
import {
  getKhidmatByPerson,
  downloadKhidmatByPersonReport,
  downloadKhidmatPersonReport,
} from '../../services/khidmat.service'

const STATUS_ICONS = {
  COMPLETED: CheckCircle2,
  PARTIAL: AlertCircle,
  RECORD_ONLY: FileText,
}

const KhidmatByPerson = () => {
  const { filters, fetchRecords } = useKhidmat()
  const [year, setYear] = useState(new Date().getFullYear())
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [downloading, setDownloading] = useState(null)

  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        year,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      }
      const data = await getKhidmatByPerson(params)
      setPeople(data.people || [])

      // Sync flat records into context for BulkReminderBar
      await fetchRecords({ ...params, limit: 500, page: 1 })
    } catch (err) {
      toast.error(err.message || 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [year, filters.search, filters.status, filters.categoryId, fetchRecords])

  useEffect(() => { loadData() }, [loadData])

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleDownloadAll = async () => {
    setDownloading('all')
    const toastId = toast.loading('Generating PDF for all people…')
    try {
      await downloadKhidmatByPersonReport({
        year,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      })
      toast.success('PDF downloaded!', { id: toastId })
    } catch {
      toast.error('Failed to generate PDF', { id: toastId })
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadPerson = async (person) => {
    setDownloading(person.key)
    const toastId = toast.loading(`Generating PDF for ${person.name}…`)
    try {
      await downloadKhidmatPersonReport(person.key, person.name, {
        year,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      })
      toast.success('PDF downloaded!', { id: toastId })
    } catch {
      toast.error('Failed to generate PDF', { id: toastId })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Year selector + download all */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-600">Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">
            {loading ? 'Loading…' : `${people.length} people`}
          </span>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={loading || people.length === 0 || downloading === 'all'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all"
        >
          {downloading === 'all' ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
          Download All PDF
        </button>
      </div>

      <BulkReminderBar />
      <KhidmatFilter />

      {/* Grouped person list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading records…
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No records found for {year}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {people.map(person => {
              const isOpen = expanded[person.key]
              return (
                <div key={person.key}>
                  {/* Person header row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(person.key)}
                  >
                    <button className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User size={16} className="text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-slate-800 ${urduClass(person.name)}`} dir={urduClass(person.name) ? 'rtl' : undefined}>{person.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={11} /> {person.phone}
                        </span>
                        {person.address && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={11} /> {person.address}
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-medium">
                          {person.recordCount} record{person.recordCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs text-slate-500">Pledged</p>
                      <p className="text-sm font-bold text-slate-800">
                        Rs {person.totalPledged?.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-amber-600">
                        Rs {person.totalRemaining?.toLocaleString('en-IN')} remaining
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadPerson(person) }}
                      disabled={downloading === person.key}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-50"
                      title="Download PDF for this person"
                    >
                      {downloading === person.key
                        ? <Loader2 size={13} className="animate-spin" />
                        : <FileDown size={13} />}
                      PDF
                    </button>
                  </div>

                  {/* Expanded records */}
                  {isOpen && (
                    <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-3 space-y-2">
                      {person.records.map(record => {
                        const Icon = STATUS_ICONS[record.status] || FileText
                        const colors = STATUS_COLORS[record.status] || STATUS_COLORS.RECORD_ONLY
                        const pct = record.amount > 0
                          ? Math.min(100, Math.round((record.receivedAmount / record.amount) * 100))
                          : 0
                        return (
                          <div
                            key={record.id}
                            className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3"
                          >
                            <div
                              className="w-2 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: record.category?.color || '#3b82f6' }}
                            />
                            <div className="flex-1 min-w-[140px]">
                              <p className={`text-sm font-semibold text-slate-800 font-urdu`} dir="rtl">
                                {getCategoryUrdu(record.category)}
                              </p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={10} />
                                {new Date(record.date).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-sm font-bold text-slate-800">
                                Rs {record.amount?.toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs text-slate-500">
                                Rs {record.receivedAmount?.toLocaleString('en-IN')} received ({pct}%)
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                              <Icon size={11} />
                              {STATUS_LABELS[record.status]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default KhidmatByPerson
