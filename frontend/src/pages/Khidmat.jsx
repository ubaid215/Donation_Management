// ============================================================
// pages/Khidmat.jsx
// Main Khidmat Records page
//
// Add to App.jsx:
//   import Khidmat from './pages/Khidmat.jsx'
//   <Route path="/khidmat" element={<Khidmat />} />
//
// NOTE: DonationProvider is already wrapping the whole app in
// App.jsx, so we only need KhidmatProvider here. Both contexts
// are available inside this page.
// ============================================================

import React, { useEffect } from 'react'
import { Plus, FileDown, HandHeart } from 'lucide-react'
import { KhidmatProvider, useKhidmat } from '../context/KhidmatContext'
import KhidmatFilter from '../components/khidmat/KhidmatFilter'
import KhidmatTable  from '../components/khidmat/KhidmatTable'
import KhidmatForm   from '../components/khidmat/KhidmatForm'

// ─────────────────────────────────────────────
// Inner page (must be inside KhidmatProvider)
// ─────────────────────────────────────────────
const KhidmatPageInner = () => {
  const {
    fetchRecords,
    openCreateForm,
    downloadReport,
    pagination,
    loading,
    filters,
  } = useKhidmat()

  // Fetch on mount and whenever key filters change
  useEffect(() => {
    fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.categoryId, filters.startDate, filters.endDate, filters.page])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-5">

        {/* Page header */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>New Record</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <KhidmatFilter />

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <KhidmatTable />
        </div>
      </div>

      {/* Create / Edit form drawer */}
      <KhidmatForm />
    </div>
  )
}

// ─────────────────────────────────────────────
// Exported page — only KhidmatProvider needed here
// since DonationProvider wraps the whole app
// ─────────────────────────────────────────────
const Khidmat = () => (
  <KhidmatProvider>
    <KhidmatPageInner />
  </KhidmatProvider>
)

export default Khidmat