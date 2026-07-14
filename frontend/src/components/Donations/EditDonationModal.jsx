// components/Donations/EditDonationModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Mail, MessageCircle } from 'lucide-react'
import { useDonations } from '../../context/DonationContext.jsx'

const EditDonationModal = ({ donation, onClose, onSuccess }) => {
  const { updateDonation, activeCategories } = useDonations()
  const [formData, setFormData] = useState({
    donorName: '',
    donorPhone: '',
    donorEmail: '',
    amount: '',
    purpose: '',
    paymentMethod: 'CASH',
    notes: '',
    receiptNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (donation) {
      setFormData({
        donorName: donation.donorName || '',
        donorPhone: donation.donorPhone || '',
        donorEmail: donation.donorEmail || '',
        amount: donation.amount || '',
        purpose: donation.purpose || '',
        paymentMethod: donation.paymentMethod || 'CASH',
        notes: donation.notes || '',
        receiptNumber: donation.receiptNumber || ''
      })
    }
  }, [donation])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.donorName.trim()) {
      setError('Donor name is required')
      return
    }
    
    if (!formData.donorPhone.trim()) {
      setError('Phone number is required')
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valid amount is required')
      return
    }
    
    if (!formData.purpose.trim()) {
      setError('Purpose is required')
      return
    }

    setLoading(true)
    try {
      const result = await updateDonation(donation.id, formData)
      if (result.success) {
        onSuccess?.(result.donation)
        onClose()
      } else {
        setError(result.error || 'Failed to update donation')
      }
    } catch (err) {
      setError('An error occurred while updating the donation')
    } finally {
      setLoading(false)
    }
  }

  if (!donation) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Donation
            </h2>
            <div className="flex items-center space-x-2">
              {donation.emailSent && (
                <span className="badge badge-success text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email Sent
                </span>
              )}
              {donation.whatsappSent && (
                <span className="badge badge-success text-xs flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp Sent
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donor Name *
              </label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter donor name"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                name="donorPhone"
                value={formData.donorPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+923001234567"
                required
              />
              {formData.donorPhone !== donation.donorPhone && (
                <p className="mt-1 text-xs text-yellow-600">
                  WhatsApp status will be reset when phone number changes
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="donorEmail"
                value={formData.donorEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="donor@example.com"
              />
              {formData.donorEmail !== donation.donorEmail && (
                <p className="mt-1 text-xs text-yellow-600">
                  Email receipt will be sent if email is updated
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (RS) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1000"
                required
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose *
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select purpose</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>
              <input
                type="text"
                name="receiptNumber"
                value={formData.receiptNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional receipt number"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Original Donation Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Original Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="block text-xs text-gray-500">Date:</span>
                <span>{new Date(donation.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Operator:</span>
                <span>{donation.operator?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Created:</span>
                <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Last Updated:</span>
                <span>{new Date(donation.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Donation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditDonationModal