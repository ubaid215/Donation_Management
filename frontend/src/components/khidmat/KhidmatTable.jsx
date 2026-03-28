// ============================================================
// components/khidmat/KhidmatTable.jsx  — UPGRADED
// Expandable rows with inline quick-pay form
// No need to open a separate modal for adding payments
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import {
  MessageCircle, Pencil, Trash2, FileDown,
  ChevronLeft, ChevronRight, CheckCircle2,
  AlertCircle, FileText, MoreVertical,
  RefreshCw, WifiOff, ChevronDown, PlusCircle,
  ChevronRight as ExpandIcon, Loader2, Check,
  DollarSign, Calendar, StickyNote, History,
  ArrowRight
} from 'lucide-react'
import { useKhidmat, STATUS_LABELS, STATUS_COLORS } from '../../context/KhidmatContext'
import { useDonations } from '../../context/DonationContext'

// ─────────────────────────────────────────────
// Portal dropdown hook (fixes overflow clipping)
// ─────────────────────────────────────────────
const usePortalDropdown = () => {
  const triggerRef = useRef(null)
  const [open, setOpen]   = useState(false)
  const [style, setStyle] = useState({})

  const recalc = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, zIndex: 9999 })
  }, [])

  useEffect(() => {
    if (!open) return
    recalc()
    window.addEventListener('scroll', recalc, true)
    window.addEventListener('resize', recalc)
    return () => { window.removeEventListener('scroll', recalc, true); window.removeEventListener('resize', recalc) }
  }, [open, recalc])

  const toggle = () => { if (!open) recalc(); setOpen(p => !p) }
  return { triggerRef, open, setOpen, style, toggle }
}

const STATUS_OPTS = [
  { value: 'COMPLETED',   label: 'Completed',   icon: CheckCircle2, colors: STATUS_COLORS.COMPLETED   },
  { value: 'PARTIAL',     label: 'Partial',     icon: AlertCircle,  colors: STATUS_COLORS.PARTIAL     },
  { value: 'RECORD_ONLY', label: 'Record Only', icon: FileText,     colors: STATUS_COLORS.RECORD_ONLY },
]

// ── Skeleton row ──────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-slate-100 animate-pulse">
    {[16, 40, 130, 90, 130, 90, 60, 60].map((w, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-3.5 rounded-full bg-slate-200" style={{ width: w }} />
      </td>
    ))}
  </tr>
)

// ── Amount progress cell ──────────────────────
const AmountProgress = ({ amount, receivedAmount, remainingAmount }) => {
  const pct = amount > 0 ? Math.min(100, Math.round((receivedAmount / amount) * 100)) : 0
  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-800">Rs {amount?.toLocaleString('en-IN')}</span>
        <span className={`font-medium ${pct >= 100 ? 'text-emerald-600' : pct > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] mt-0.5 text-slate-400">
        <span>Rcvd: Rs {receivedAmount?.toLocaleString('en-IN') ?? 0}</span>
        <span>Left: Rs {remainingAmount?.toLocaleString('en-IN') ?? amount?.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

// ── Category pill ─────────────────────────────
const CategoryPill = ({ categoryId, categoryFromRecord }) => {
  const { activeCategories } = useDonations()
  const cat = activeCategories.find(c => c.id === categoryId) || categoryFromRecord
  if (!cat) return <span className="text-xs text-slate-400">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#3b82f6' }} />
      {cat.name}
    </span>
  )
}

// ── Status dropdown (portalled) ───────────────
const StatusDropdown = ({ recordId, currentStatus }) => {
  const { quickUpdateStatus, updatingStatus } = useKhidmat()
  const { triggerRef, open, setOpen, style, toggle } = usePortalDropdown()
  const isUpdating = updatingStatus[recordId]
  const c = STATUS_COLORS[currentStatus] || STATUS_COLORS.RECORD_ONLY

  return (
    <div className="relative inline-block">
      <button ref={triggerRef} onClick={toggle} disabled={isUpdating}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
          ${c.bg} ${c.text} ${c.border}
          ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'}`}>
        {isUpdating ? <RefreshCw size={10} className="animate-spin" />
          : <>{STATUS_LABELS[currentStatus] || currentStatus}<ChevronDown size={10} /></>}
      </button>

      {open && !isUpdating && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div style={style} className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden min-w-[148px]">
            {STATUS_OPTS.map(opt => {
              const Icon = opt.icon; const isCurrent = opt.value === currentStatus
              return (
                <button key={opt.value}
                  onClick={() => { if (!isCurrent) quickUpdateStatus(recordId, opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors
                    ${isCurrent ? `${opt.colors.bg} ${opt.colors.text} cursor-default` : 'hover:bg-slate-50 text-slate-600'}`}>
                  <Icon size={13} />{opt.label}
                  {isCurrent && <span className="ml-auto text-[10px] opacity-60">Current</span>}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── WhatsApp button ───────────────────────────
const WhatsAppButton = ({ record }) => {
  const { sendWhatsApp, sendingWhatsApp } = useKhidmat()
  const isSending = sendingWhatsApp[record.id]

  return (
    <button onClick={() => sendWhatsApp(record.id)} disabled={isSending}
      title={record.whatsappSent ? 'Resend WhatsApp' : 'Send WhatsApp'}
      className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all
        ${isSending ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : record.whatsappSent
            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
            : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
      {isSending
        ? <RefreshCw size={14} className="animate-spin" />
        : <MessageCircle size={14} strokeWidth={2} />}
      {record.whatsappSent && !isSending && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
      )}
    </button>
  )
}

// ── Row actions (portalled) ───────────────────
const RowActions = ({ record }) => {
  const { openEditForm, deleteRecord, downloadReceipt } = useKhidmat()
  const { triggerRef, open, setOpen, toggle } = usePortalDropdown()
  const [confirming, setConfirming] = useState(false)
  const [menuStyle,  setMenuStyle]  = useState({})

  const calcStyle = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuStyle({ position: 'fixed', top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 9999 })
  }, [triggerRef])

  const handleToggle = () => { calcStyle(); toggle(); setConfirming(false) }
  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setOpen(false); setConfirming(false)
    await deleteRecord(record.id)
  }

  return (
    <div className="relative inline-block">
      <button ref={triggerRef} onClick={handleToggle}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <MoreVertical size={15} />
      </button>

      {open && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setOpen(false); setConfirming(false) }} />
          <div style={menuStyle} className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden min-w-[170px]">
            <button onClick={() => { openEditForm(record); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Pencil size={14} /> Edit Record
            </button>
            <button onClick={() => { downloadReceipt(record.id, record.name); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <FileDown size={14} /> Download Receipt
            </button>
            <div className="border-t border-slate-100" />
            <button onClick={handleDelete}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors
                ${confirming ? 'text-red-600 bg-red-50 font-semibold' : 'text-red-500 hover:bg-red-50'}`}>
              <Trash2 size={14} />{confirming ? 'Confirm delete?' : 'Delete'}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// INLINE QUICK-PAY FORM (shown in expanded row)
// ─────────────────────────────────────────────
const QuickPayForm = ({ record, onSuccess, onCancel }) => {
  const { addPayment } = useKhidmat()
  const [amount,   setAmount]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const amountRef = useRef(null)

  useEffect(() => { amountRef.current?.focus() }, [])

  const remaining = record.remainingAmount ?? (record.amount - record.receivedAmount)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) { setError('Enter a valid amount'); return }
    if (val > remaining) { setError(`Cannot exceed remaining Rs ${remaining.toLocaleString('en-IN')}`); return }

    setSaving(true); setError('')
    try {
      await addPayment(record.id, { amount: val, notes, paidAt: date })
      setSuccess(true)
      setTimeout(() => onSuccess?.(), 900)
    } catch (err) {
      setError(err.message || 'Payment failed')
    } finally {
      setSaving(false)
    }
  }

  const quickAmounts = [
    remaining,
    Math.round(remaining * 0.5),
    Math.round(remaining * 0.25),
  ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).slice(0, 3)

  if (success) return (
    <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 font-semibold text-sm">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check size={14} />
      </div>
      Payment recorded!
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add Payment</p>

      {/* Quick amount chips */}
      {quickAmounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-400 self-center">Quick:</span>
          {quickAmounts.map((v, i) => (
            <button key={i} type="button" onClick={() => setAmount(v.toString())}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
                ${parseFloat(amount) === v
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'}`}>
              {i === 0 ? 'Full' : `${Math.round((v / record.amount) * 100)}%`} — Rs {v.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      )}

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
            <DollarSign size={10} /> Amount (Rs)
          </label>
          <input ref={amountRef} type="number" min="1" max={remaining} step="0.01"
            value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
            placeholder={`Max Rs ${remaining.toLocaleString('en-IN')}`}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
                       placeholder-slate-300 bg-white transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
            <Calendar size={10} /> Date
          </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700
                       focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
          <StickyNote size={10} /> Notes (optional)
        </label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Cash received at office"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800
                     focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
                     placeholder-slate-300 bg-white transition-all" />
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60
                     text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
          {saving ? <><Loader2 size={12} className="animate-spin" />Saving…</> : <><Check size={12} />Record Payment</>}
        </button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────
// EXPANDED ROW PANEL
// Shows payment history + quick-pay form
// ─────────────────────────────────────────────
const ExpandedRow = ({ record, colSpan, onPaymentAdded }) => {
  const { fetchRecords } = useKhidmat()
  const [payments,  setPayments]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(record.remainingAmount > 0)

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/khidmat/${record.id}/payments`)
        const data = await res.json()
        setPayments(data.payments || [])
      } catch {
        setPayments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [record.id])

  const handlePaymentSuccess = () => {
    setShowForm(false)
    fetchRecords()
    onPaymentAdded?.()
  }

  return (
    <tr className="bg-slate-50/80 border-b border-slate-200">
      <td colSpan={colSpan} className="px-4 py-0">
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* LEFT: Payment history */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <History size={12} /> Payment History
            </p>
            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-8 rounded-lg bg-slate-200 animate-pulse" />)}
              </div>
            ) : payments?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {payments.map((p, i) => (
                  <div key={p.id || i}
                    className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-3 py-2">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        Rs {parseFloat(p.amount).toLocaleString('en-IN')}
                      </span>
                      {p.notes && <span className="text-xs text-slate-400 ml-2">— {p.notes}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Quick pay form or completed badge */}
          <div>
            {record.remainingAmount > 0 ? (
              showForm ? (
                <QuickPayForm
                  record={record}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <button onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-all">
                  <PlusCircle size={16} /> Add Another Payment
                </button>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">Fully paid!</p>
                <p className="text-xs text-slate-400">Rs {record.amount?.toLocaleString('en-IN')} received</p>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Pagination ────────────────────────────────
const Pagination = () => {
  const { pagination, goToPage, fetchRecords } = useKhidmat()
  const { page, pages, total, limit } = pagination
  if (!pages || pages <= 1) return null
  const from = (page - 1) * limit + 1; const to = Math.min(page * limit, total)
  const go = (p) => { goToPage(p); fetchRecords({ page: p }) }
  const pageNums = []
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) pageNums.push(i)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
      <span className="text-xs text-slate-500">
        Showing <strong className="text-slate-700">{from}–{to}</strong> of <strong className="text-slate-700">{total}</strong> records
      </span>
      <div className="flex items-center gap-1">
        <PageBtn icon={<ChevronLeft size={14} />}  onClick={() => go(page - 1)} disabled={page <= 1} />
        {page > 3 && <><PageBtn label="1" onClick={() => go(1)} /><span className="px-1 text-slate-400 text-xs">…</span></>}
        {pageNums.map(n => <PageBtn key={n} label={n} active={n === page} onClick={() => go(n)} />)}
        {page < pages - 2 && <><span className="px-1 text-slate-400 text-xs">…</span><PageBtn label={pages} onClick={() => go(pages)} /></>}
        <PageBtn icon={<ChevronRight size={14} />} onClick={() => go(page + 1)} disabled={page >= pages} />
      </div>
    </div>
  )
}

const PageBtn = ({ label, icon, active, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={`min-w-[32px] h-8 rounded-lg px-2 text-xs font-medium transition-all flex items-center justify-center
      ${active ? 'bg-blue-700 text-white shadow-sm' : ''}
      ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      ${!active && !disabled ? 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200' : ''}`}>
    {icon || label}
  </button>
)

// ─────────────────────────────────────────────
// MAIN TABLE
// ─────────────────────────────────────────────
const KhidmatTable = () => {
  const { records, loading, error, fetchRecords } = useKhidmat()
  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const COLS = ['', 'Date', 'Name', 'Category', 'Amount / Progress', 'Status', 'WhatsApp', 'Actions']

  if (!loading && error) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <WifiOff size={36} className="text-slate-300 mb-3" />
      <p className="text-slate-500 text-sm font-medium mb-4">Failed to load records</p>
      <button onClick={() => fetchRecords()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  )

  if (!loading && records.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <FileText size={36} className="text-slate-300 mb-3" />
      <p className="text-slate-600 font-semibold mb-1">No records found</p>
      <p className="text-slate-400 text-sm">Try adjusting your filters or create a new record.</p>
    </div>
  )

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {COLS.map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : records.map(record => {
                  const isExpanded = expandedRows.has(record.id)
                  return (
                    <React.Fragment key={record.id}>
                      <tr className={`border-b border-slate-100 transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'}`}>

                        {/* Expand toggle */}
                        <td className="pl-3 pr-1 py-3.5 w-8">
                          <button onClick={() => toggleRow(record.id)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all
                              ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-90' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}>
                            <ExpandIcon size={13} />
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(record.date || record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800 text-sm leading-tight">{record.name}</div>
                          {record.address && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">{record.address}</div>}
                          <div className="text-xs text-slate-400 mt-0.5">{record.phone}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <CategoryPill categoryId={record.categoryId} categoryFromRecord={record.category} />
                        </td>
                        <td className="px-4 py-3.5">
                          <AmountProgress amount={record.amount} receivedAmount={record.receivedAmount} remainingAmount={record.remainingAmount} />
                        </td>
                        <td className="px-4 py-3.5"><StatusDropdown recordId={record.id} currentStatus={record.status} /></td>
                        <td className="px-4 py-3.5"><WhatsAppButton record={record} /></td>
                        <td className="px-4 py-3.5"><RowActions record={record} /></td>
                      </tr>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <ExpandedRow
                          record={record}
                          colSpan={COLS.length}
                          onPaymentAdded={() => toggleRow(record.id)}
                        />
                      )}
                    </React.Fragment>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 p-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="flex justify-between"><div className="h-4 w-32 rounded-full bg-slate-200" /><div className="h-4 w-16 rounded-full bg-slate-200" /></div>
                <div className="h-3 w-24 rounded-full bg-slate-200" />
                <div className="h-2 w-full rounded-full bg-slate-200" />
              </div>
            ))
          : records.map(record => {
              const isExpanded = expandedRows.has(record.id)
              return (
                <div key={record.id} className={`rounded-2xl border shadow-sm transition-all ${isExpanded ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 bg-white'}`}>

                  {/* Card header — tap to expand */}
                  <button className="w-full text-left p-4 space-y-3" onClick={() => toggleRow(record.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{record.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{record.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryPill categoryId={record.categoryId} categoryFromRecord={record.category} />
                        <ExpandIcon size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    <AmountProgress amount={record.amount} receivedAmount={record.receivedAmount} remainingAmount={record.remainingAmount} />
                  </button>

                  {/* Bottom action row */}
                  <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-0">
                    <StatusDropdown recordId={record.id} currentStatus={record.status} />
                    <div className="flex items-center gap-2">
                      <WhatsAppButton record={record} />
                      <RowActions record={record} />
                    </div>
                  </div>

                  {/* Expanded section on mobile */}
                  {isExpanded && (
                    <div className="border-t border-blue-100 px-4 py-4 bg-white rounded-b-2xl">
                      <ExpandedRow
                        record={record}
                        colSpan={1}
                        onPaymentAdded={() => toggleRow(record.id)}
                      />
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>

      <Pagination />
    </div>
  )
}

export default KhidmatTable