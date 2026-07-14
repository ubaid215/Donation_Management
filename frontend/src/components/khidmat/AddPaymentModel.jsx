/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
// ============================================================
// components/khidmat/AddPaymentModal.jsx
// Modal to add an installment payment to a KhidmatRecord
// ============================================================

import React, { useState, useEffect } from 'react'
import { X, DollarSign, FileText, Calendar, Loader2, Plus, AlertCircle } from 'lucide-react'
import { useKhidmat } from '../../context/KhidmatContext'

const AddPaymentModal = () => {
  const { paymentModalRecord, setPaymentModalRecord, addPayment, addingPayment } = useKhidmat()

  const [form,   setForm]   = useState({ amount: '', notes: '', paidAt: new Date().toISOString().split('T')[0] })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (paymentModalRecord) {
      setForm({ amount: '', notes: '', paidAt: new Date().toISOString().split('T')[0] })
      setErrors({})
    }
  }, [paymentModalRecord])

  if (!paymentModalRecord) return null

  const { id, name, amount, receivedAmount, remainingAmount, status } = paymentModalRecord
  const pct = amount > 0 ? Math.min(100, Math.round((receivedAmount / amount) * 100)) : 0

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'Valid amount is required'
    else if (amt > remainingAmount) e.amount = `Cannot exceed remaining amount of Rs ${remainingAmount?.toLocaleString('en-IN')}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    await addPayment(id, { ...form, amount: parseFloat(form.amount) })
  }

  const newReceived  = receivedAmount + (parseFloat(form.amount) || 0)
  const newPct       = amount > 0 ? Math.min(100, Math.round((newReceived / amount) * 100)) : 0

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setPaymentModalRecord(null)}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700">
            <div>
              <h2 className="text-white font-semibold text-sm">Record Payment</h2>
              <p className="text-emerald-100 text-xs mt-0.5">{name}</p>
            </div>
            <button onClick={() => setPaymentModalRecord(null)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Current progress */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Received so far</span>
              <span className="font-semibold text-slate-700">
                Rs {receivedAmount?.toLocaleString('en-IN')} / Rs {amount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{pct}% collected</span>
              <span className="text-amber-600 font-medium">Rs {remainingAmount?.toLocaleString('en-IN')} remaining</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

            {/* Amount */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <DollarSign size={12} className="text-slate-400" /> Payment Amount (Rs) <span className="text-red-400">*</span>
              </label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')}
                placeholder={`Max: Rs ${remainingAmount?.toLocaleString('en-IN')}`}
                autoFocus
                className={`w-full px-3 py-2.5 rounded-xl text-sm border
                  ${errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}
                  focus:outline-none focus:ring-2 ${errors.amount ? 'focus:ring-red-300' : 'focus:ring-emerald-300'}
                  focus:border-transparent placeholder-slate-400 transition-all`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.amount}
                </p>
              )}

              {/* Live preview of new total */}
              {form.amount && !errors.amount && (
                <div className="mt-2 space-y-1.5">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${newPct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    After payment: <strong className="text-emerald-600">Rs {newReceived.toLocaleString('en-IN')}</strong> collected ({newPct}%)
                    {newPct >= 100 && <span className="ml-1 text-emerald-600 font-semibold">— Fully paid! ✓</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Calendar size={12} className="text-slate-400" /> Payment Date
              </label>
              <input type="date" value={form.paidAt} onChange={set('paidAt')}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition-all" />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <FileText size={12} className="text-slate-400" /> Notes (optional)
              </label>
              <input value={form.notes} onChange={set('notes')} placeholder="e.g. Received via bank transfer"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent
                  placeholder-slate-400 transition-all" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setPaymentModalRecord(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={addingPayment}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
                {addingPayment ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Plus size={15} /> Record Payment</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddPaymentModal