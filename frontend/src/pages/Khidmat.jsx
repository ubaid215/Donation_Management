// ============================================================
// pages/Khidmat.jsx — tabbed: Records | Analytics
// ============================================================

import React, { useEffect, useState } from 'react'
import { Plus, FileDown, HandHeart, TrendingUp, List } from 'lucide-react'
import { KhidmatProvider, useKhidmat } from '../context/KhidmatContext'
import KhidmatFilter    from '../components/khidmat/KhidmatFilter'
import KhidmatTable     from '../components/khidmat/KhidmatTable'
import KhidmatForm      from '../components/khidmat/KhidmatForm'
import KhidmatAnalytics from '../components/khidmat/KhidmatAnalytics'
import AddPaymentModel  from '../components/khidmat/AddPaymentModel'

const TABS = [
  { id: 'records',   label: 'Records',   icon: List       },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
]

const KhidmatPageInner = () => {
  const [activeTab, setActiveTab] = useState('records')
  const { fetchRecords, openCreateForm, downloadReport, pagination, loading, filters } = useKhidmat()

  useEffect(() => {
    if (activeTab === 'records') fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.categoryId, filters.startDate, filters.endDate, filters.page, activeTab])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-sm">
              <HandHeart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Khidmat Records</h1>
              <p className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${pagination.total ?? 0} records total`}
              </p>
            </div>
          </div>
          {activeTab === 'records' && (
            <div className="flex items-center gap-2">
              <button onClick={downloadReport}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-all">
                <FileDown size={15} /><span className="hidden sm:inline">Export PDF</span>
              </button>
              <button onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all">
                <Plus size={16} />New Record
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
          {TABS.map(tab => {
            const Icon = tab.icon; const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${active ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon size={15} />{tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'records' ? (
          <>
            <KhidmatFilter />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <KhidmatTable />
            </div>
          </>
        ) : (
          <KhidmatAnalytics />
        )}
      </div>

      <KhidmatForm />
      <AddPaymentModel />
    </div>
  )
}

const Khidmat = () => (
  <KhidmatProvider>
    <KhidmatPageInner />
  </KhidmatProvider>
)

export default Khidmat