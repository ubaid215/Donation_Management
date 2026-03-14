/* eslint-disable react-hooks/set-state-in-effect */
// ============================================================
// components/khidmat/KhidmatFilter.jsx
// Filter bar — mobile-first, status badge pills, category dropdown
// Categories sourced from DonationContext.activeCategories
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  Search, SlidersHorizontal, X, ChevronDown,
  CheckCircle2, AlertCircle, FileText, Tag, Calendar
} from 'lucide-react'
import { useKhidmat, STATUS_COLORS } from '../../context/KhidmatContext'
import { useDonations } from '../../context/DonationContext'

// ─────────────────────────────────────────────
// Status options
// ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'COMPLETED',   label: 'Completed',   icon: CheckCircle2, colors: STATUS_COLORS.COMPLETED   },
  { value: 'PARTIAL',     label: 'Partial',     icon: AlertCircle,  colors: STATUS_COLORS.PARTIAL     },
  { value: 'RECORD_ONLY', label: 'Record Only', icon: FileText,     colors: STATUS_COLORS.RECORD_ONLY },
]

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const KhidmatFilter = () => {
  const { filters, applyFilters, resetFilters, fetchRecords } = useKhidmat()
  // ← categories from DonationContext — already loaded on app boot via useEffect
  const { activeCategories, fetchActiveCategories } = useDonations()

  const [local,      setLocal]      = useState({ ...filters })
  const [showPanel,  setShowPanel]  = useState(false)
  const [catOpen,    setCatOpen]    = useState(false)
  const catRef = useRef(null)

  // Sync local state when context filters reset externally
  useEffect(() => { setLocal({ ...filters }) }, [filters])

  // Load categories if somehow empty (safety net)
  useEffect(() => {
    if (activeCategories.length === 0) fetchActiveCategories()
  }, [])

  // Close category dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Count active filters (for badge on mobile toggle button)
  const activeCount = [local.status, local.categoryId, local.startDate, local.endDate, local.search]
    .filter(Boolean).length

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }))

  // Debounced search
  const handleSearch = (e) => {
    const val = e.target.value
    set('search', val)
    clearTimeout(window._khidmatSearchTimer)
    window._khidmatSearchTimer = setTimeout(() => {
      const updated = applyFilters({ search: val })
      fetchRecords(updated)
    }, 400)
  }

  const handleApply = () => {
    const updated = applyFilters(local)
    fetchRecords(updated)
    setShowPanel(false)
  }

  const handleReset = () => {
    const empty = { search: '', status: '', categoryId: '', startDate: '', endDate: '', page: 1, limit: 20 }
    setLocal(empty)
    resetFilters()
    fetchRecords(empty)
    setShowPanel(false)
  }

  // Toggle a status badge pill — tap again to deselect
  const handleStatusBadge = (status) => {
    const next    = local.status === status ? '' : status
    const updated = applyFilters({ status: next })
    setLocal(prev => ({ ...prev, status: next }))
    fetchRecords(updated)
  }

  // Resolve selected category name for dropdown label
  const selectedCatName = local.categoryId
    ? activeCategories.find(c => c.id === local.categoryId)?.name || 'Category'
    : 'All categories'

  return (
    <div className="space-y-3">

      {/* ── Row 1: Search + toggle ──────────────── */}
      <div className="flex gap-2">

        {/* Search input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={local.search}
            onChange={handleSearch}
            placeholder="Search name, phone, address…"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
                       placeholder-slate-400 transition-all"
          />
          {local.search && (
            <button
              onClick={() => { set('search', ''); const u = applyFilters({ search: '' }); fetchRecords(u) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter panel toggle */}
        <button
          onClick={() => setShowPanel(p => !p)}
          className={`
            relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all
            ${showPanel || activeCount > 0
              ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }
          `}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Row 2: Status badge pills ───────────── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(opt => {
          const Icon   = opt.icon
          const active = local.status === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => handleStatusBadge(opt.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${active
                  ? `${opt.colors.bg} ${opt.colors.text} ${opt.colors.border} shadow-sm scale-105`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <Icon size={12} strokeWidth={active ? 2.5 : 2} />
              {opt.label}
              {active && <X size={11} className="ml-0.5 opacity-70" />}
            </button>
          )
        })}

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                       bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* ── Expandable advanced filter panel ───── */}
      {showPanel && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Category — custom seamless dropdown */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Tag size={12} /> Category
              </label>
              <div ref={catRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCatOpen(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white hover:border-blue-300 transition-all"
                >
                  <span className={local.categoryId ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedCatName}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${catOpen ? 'rotate-180' : ''}`} />
                </button>

                {catOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    {/* All option */}
                    <button
                      onClick={() => { set('categoryId', ''); setCatOpen(false) }}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-slate-50
                        ${!local.categoryId ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'}`}
                    >
                      All categories
                    </button>

                    {activeCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { set('categoryId', cat.id); setCatOpen(false) }}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-slate-50
                          ${local.categoryId === cat.id ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date from */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Calendar size={12} /> From
              </label>
              <input
                type="date"
                value={local.startDate}
                onChange={e => set('startDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Calendar size={12} /> To
              </label>
              <input
                type="date"
                value={local.endDate}
                onChange={e => set('endDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Panel actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default KhidmatFilter