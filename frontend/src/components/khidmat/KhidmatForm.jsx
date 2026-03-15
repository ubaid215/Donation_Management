/* eslint-disable no-unused-vars */
// ============================================================
// components/khidmat/KhidmatForm.jsx
// Create / Edit drawer — now includes receivedAmount field
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  X, User, Phone, MapPin, DollarSign, Tag,
  CheckCircle2, AlertCircle, FileText, Calendar,
  Loader2, Save, Plus, TrendingDown
} from 'lucide-react'
import { useKhidmat, STATUS_COLORS } from '../../context/KhidmatContext'
import { useDonations } from '../../context/DonationContext'

const STATUS_OPTIONS = [
  { value: 'COMPLETED',   label: 'Completed',   desc: 'Fully received',   icon: CheckCircle2, colors: STATUS_COLORS.COMPLETED   },
  { value: 'PARTIAL',     label: 'Partial',     desc: 'Partially received',icon: AlertCircle,  colors: STATUS_COLORS.PARTIAL     },
  { value: 'RECORD_ONLY', label: 'Record Only', desc: 'No payment yet',   icon: FileText,     colors: STATUS_COLORS.RECORD_ONLY },
]

const EMPTY_FORM = {
  name: '', phone: '', address: '', amount: '', receivedAmount: '',
  categoryId: '', status: 'RECORD_ONLY', notes: '',
  date: new Date().toISOString().split('T')[0],
}

const KhidmatForm = () => {
  const { showForm, editingRecord, closeForm, createRecord, updateRecord } = useKhidmat()
  const { activeCategories, categoriesLoading, fetchActiveCategories } = useDonations()

  const [form,       setForm]       = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors,     setErrors]     = useState({})
  const firstInputRef = useRef(null)

  // Populate when editing
  useEffect(() => {
    if (editingRecord) {
      setForm({
        name:           editingRecord.name           || '',
        phone:          editingRecord.phone          || '',
        address:        editingRecord.address        || '',
        amount:         editingRecord.amount         || '',
        receivedAmount: editingRecord.receivedAmount || '',
        categoryId:     editingRecord.categoryId     || '',
        status:         editingRecord.status         || 'RECORD_ONLY',
        notes:          editingRecord.notes          || '',
        date:           editingRecord.date
          ? new Date(editingRecord.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
    } else { setForm(EMPTY_FORM) }
    setErrors({})
  }, [editingRecord, showForm])

  useEffect(() => {
    if (showForm && activeCategories.length === 0) fetchActiveCategories()
  }, [showForm])

  useEffect(() => {
    if (showForm) setTimeout(() => firstInputRef.current?.focus(), 80)
  }, [showForm])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') closeForm() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [closeForm])

  if (!showForm) return null

  const set = (field) => (e) => {
    const val = e.target.value
    setForm(prev => {
      const next = { ...prev, [field]: val }
      // Auto-derive status from amounts
      if (field === 'amount' || field === 'receivedAmount') {
        const total    = parseFloat(field === 'amount' ? val : next.amount) || 0
        const received = parseFloat(field === 'receivedAmount' ? val : next.receivedAmount) || 0
        if (total > 0) {
          if (received <= 0)       next.status = 'RECORD_ONLY'
          else if (received >= total) next.status = 'COMPLETED'
          else                     next.status = 'PARTIAL'
        }
      }
      return next
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name       = 'Name is required'
    if (!form.phone.trim()) e.phone      = 'Phone is required'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
                             e.amount     = 'Valid pledged amount is required'
    if (form.receivedAmount !== '' && Number(form.receivedAmount) > Number(form.amount))
                             e.receivedAmount = 'Cannot exceed pledged amount'
    if (!form.categoryId)   e.categoryId = 'Please select a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        amount:         parseFloat(form.amount),
        receivedAmount: form.receivedAmount !== '' ? parseFloat(form.receivedAmount) : 0,
      }
      if (editingRecord) await updateRecord(editingRecord.id, payload)
      else               await createRecord(payload)
    // eslint-disable-next-line no-empty
    } catch (_) {}
    finally { setSubmitting(false) }
  }

  // Progress bar
  const total    = parseFloat(form.amount)         || 0
  const received = parseFloat(form.receivedAmount) || 0
  const pct      = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0
  const remaining = Math.max(0, total - received)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeForm} />

      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[500px] flex flex-col bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-700 to-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              {editingRecord ? <Save size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm leading-tight">
                {editingRecord ? 'Edit Khidmat Record' : 'New Khidmat Record'}
              </h2>
              <p className="text-blue-200 text-xs">
                {editingRecord ? `Editing — ${editingRecord.name}` : 'Fill in service details below'}
              </p>
            </div>
          </div>
          <button onClick={closeForm} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Status picker — auto-updates from amounts */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(opt => {
                const Icon = opt.icon; const active = form.status === opt.value
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                    className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all
                      ${active ? `${opt.colors.bg} ${opt.colors.border} ${opt.colors.text} shadow-sm scale-[1.02]` : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                    <span className="text-[10px] leading-tight opacity-70 hidden sm:block">{opt.desc}</span>
                    {active && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current opacity-70" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" icon={<User size={15} />} error={errors.name} required>
              <input ref={firstInputRef} value={form.name} onChange={set('name')} placeholder="Person's name" className={inputCls(errors.name)} />
            </Field>
            <Field label="Phone" icon={<Phone size={15} />} error={errors.phone} required>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+92 300 0000000" className={inputCls(errors.phone)} />
            </Field>
          </div>

          {/* Total pledged + Received amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Total Promised (Rs)" icon={<DollarSign size={15} />} error={errors.amount} required>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={set('amount')} placeholder="e.g. 10000" className={inputCls(errors.amount)} />
            </Field>
            <Field label="Initially Received (Rs)" icon={<TrendingDown size={15} />} error={errors.receivedAmount}>
              <input type="number" min="0" step="0.01" value={form.receivedAmount}
                onChange={set('receivedAmount')} placeholder="e.g. 4000 (optional)" className={inputCls(errors.receivedAmount)} />
            </Field>
          </div>

          {/* Progress bar — visible when both amounts are entered */}
          {total > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Received: <strong className="text-emerald-600">Rs {received.toLocaleString('en-IN')}</strong></span>
                <span>Remaining: <strong className="text-amber-600">Rs {remaining.toLocaleString('en-IN')}</strong></span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-right">{pct}% collected</p>
            </div>
          )}

          {/* Category */}
          <Field label="Category" icon={<Tag size={15} />} error={errors.categoryId} required>
            <select value={form.categoryId} onChange={set('categoryId')} disabled={categoriesLoading} className={inputCls(errors.categoryId)}>
              <option value="">{categoriesLoading ? 'Loading…' : 'Select category'}</option>
              {activeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </Field>

          {/* Address */}
          <Field label="Address" icon={<MapPin size={15} />}>
            <input value={form.address} onChange={set('address')} placeholder="Optional address" className={inputCls()} />
          </Field>

          {/* Date */}
          <Field label="Date" icon={<Calendar size={15} />}>
            <input type="date" value={form.date} onChange={set('date')} className={inputCls()} />
          </Field>

          {/* Notes */}
          <Field label="Notes" icon={<FileText size={15} />}>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" rows={3} className={`${inputCls()} resize-none`} />
          </Field>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> {editingRecord ? 'Save Changes' : 'Create Record'}</>}
          </button>
        </div>
      </div>
    </>
  )
}

const Field = ({ label, icon, error, required, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      <span className="text-slate-400">{icon}</span>{label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
  </div>
)

const inputCls = (error) => `
  w-full px-3 py-2.5 rounded-xl text-sm text-slate-800
  border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}
  focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-300' : 'focus:ring-blue-300'}
  focus:border-transparent placeholder-slate-400 transition-all
`

export default KhidmatForm