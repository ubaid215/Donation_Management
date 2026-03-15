// ============================================================
// components/khidmat/KhidmatAnalytics.jsx
// Real-time chart panel: monthly trend + by-category breakdown
// Uses Recharts (already available in the project)
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { TrendingUp, PieChart, RefreshCw, Calendar } from 'lucide-react'
import { useKhidmat } from '../../context/KhidmatContext'
import { useDonations } from '../../context/DonationContext'

// ─────────────────────────────────────────────
// Custom Tooltip for currency values
// ─────────────────────────────────────────────
const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex justify-between gap-4 mb-1">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-semibold text-slate-800">Rs {Number(entry.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Date range filter bar
// ─────────────────────────────────────────────
const DateRangeFilter = ({ value, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    {[
      { label: 'Last 3M', months: 3 },
      { label: 'Last 6M', months: 6 },
      { label: 'This Year', months: 12 },
      { label: 'All time', months: 0 },
    ].map(opt => {
      const getRange = () => {
        if (opt.months === 0) return { startDate: '', endDate: '' }
        const end   = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - opt.months)
        return {
          startDate: start.toISOString().split('T')[0],
          endDate:   end.toISOString().split('T')[0],
        }
      }
      const range    = getRange()
      const isActive = value.startDate === range.startDate && value.endDate === range.endDate
      return (
        <button key={opt.label} onClick={() => onChange(range)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
            ${isActive ? 'bg-blue-700 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
          {opt.label}
        </button>
      )
    })}
  </div>
)

// ─────────────────────────────────────────────
// Category filter dropdown
// ─────────────────────────────────────────────
const CategoryFilter = ({ value, onChange }) => {
  const { activeCategories } = useDonations()
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
      <option value="">All Categories</option>
      {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )
}

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:    'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:   'bg-amber-50 border-amber-100 text-amber-700',
    slate:   'bg-slate-50 border-slate-100 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const KhidmatAnalytics = () => {
  const { analytics, analyticsLoading, fetchAnalytics } = useKhidmat()

  const [dateRange,   setDateRange]   = useState({ startDate: '', endDate: '' })
  const [categoryId,  setCategoryId]  = useState('')

  // Fetch on mount and on filter change
  useEffect(() => {
    const params = {}
    if (dateRange.startDate) params.startDate = dateRange.startDate
    if (dateRange.endDate)   params.endDate   = dateRange.endDate
    if (categoryId)          params.categoryId = categoryId
    fetchAnalytics(params)
  }, [dateRange, categoryId])

  const monthly    = analytics?.monthlyTrend ?? []
  const byCategory = analytics?.byCategory   ?? []

  // Compute summary from byCategory totals
  const totalPledged  = byCategory.reduce((s, c) => s + c.pledged,  0)
  const totalReceived = byCategory.reduce((s, c) => s + c.received, 0)
  const totalRecords  = byCategory.reduce((s, c) => s + c.count,    0)
  const collectionRate = totalPledged > 0 ? Math.round((totalReceived / totalPledged) * 100) : 0

  return (
    <div className="space-y-5">

      {/* ── Filter row ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-700" />
          <h2 className="text-base font-bold text-slate-800">Khidmat Analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <CategoryFilter  value={categoryId} onChange={setCategoryId} />
          <button onClick={() => fetchAnalytics({ startDate: dateRange.startDate, endDate: dateRange.endDate, categoryId })}
            disabled={analyticsLoading}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={analyticsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ──────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Records"    value={totalRecords.toLocaleString('en-IN')} color="slate" />
        <StatCard label="Total Pledged"    value={`Rs ${totalPledged.toLocaleString('en-IN')}`} color="blue" />
        <StatCard label="Total Received"   value={`Rs ${totalReceived.toLocaleString('en-IN')}`} color="emerald" />
        <StatCard label="Collection Rate"  value={`${collectionRate}%`}
          sub={`Rs ${(totalPledged - totalReceived).toLocaleString('en-IN')} remaining`} color="amber" />
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* ── Monthly trend line chart ───────── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={15} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-slate-800">Monthly Trend</h3>
              <span className="text-xs text-slate-400 ml-1">Pledged vs Received</span>
            </div>

            {monthly.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data for selected range</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="pledged"  name="Pledged"  stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Category bar chart ─────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <PieChart size={15} className="text-blue-700" />
              <h3 className="text-sm font-semibold text-slate-800">By Category</h3>
              <span className="text-xs text-slate-400 ml-1">Pledged vs Received per category</span>
            </div>

            {byCategory.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byCategory} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pledged"  name="Pledged"  radius={[4, 4, 0, 0]}>
                      {byCategory.map((entry, i) => <Cell key={i} fill={entry.color || '#3b82f6'} opacity={0.5} />)}
                    </Bar>
                    <Bar dataKey="received" name="Received" radius={[4, 4, 0, 0]}>
                      {byCategory.map((entry, i) => <Cell key={i} fill={entry.color || '#10b981'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Category detail table */}
                <div className="mt-4 divide-y divide-slate-100">
                  {byCategory.map(cat => (
                    <div key={cat.categoryId} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                        <span className="text-xs text-slate-400">({cat.count} records)</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">Rs {cat.pledged.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-600 font-semibold">Rs {cat.received.toLocaleString('en-IN')}</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full
                          ${cat.collectionRate >= 100 ? 'bg-emerald-100 text-emerald-700'
                            : cat.collectionRate > 0   ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'}`}>
                          {cat.collectionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default KhidmatAnalytics