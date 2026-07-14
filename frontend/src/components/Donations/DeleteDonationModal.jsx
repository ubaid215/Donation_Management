// components/Donations/DeleteDonationModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { useDonations } from '../../context/DonationContext.jsx'

const DeleteDonationModal = ({ donation, onClose, onSuccess }) => {
  const { deleteDonation } = useDonations()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    reason: ''
  })

  // Reset errors when modal opens/closes
  useEffect(() => {
    if (donation) {
      setReason('')
      setErrors({ reason: '' })
    }
  }, [donation])

  const validateForm = () => {
    const newErrors = {}
    
    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for deletion'
    } else if (reason.trim().length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters'
    } else if (reason.trim().length > 500) {
      newErrors.reason = 'Reason must be less than 500 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleReasonChange = (e) => {
    const value = e.target.value
    setReason(value)
    
    // Clear error when user starts typing
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteDonation(donation.id, reason.trim())
      if (result.success) {
        onSuccess?.(result.donation)
        onClose()
      } else {
        setErrors(prev => ({ 
          ...prev, 
          reason: result.error || 'Failed to delete donation' 
        }))
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred while deleting the donation'
      setErrors(prev => ({ 
        ...prev, 
        reason: errorMessage 
      }))
    } finally {
      setLoading(false)
    }
  }

  if (!donation) return null

  // Format amount for display
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Delete Donation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-medium">Warning</h3>
                <p className="text-red-700 text-sm mt-1">
                  This action will soft delete the donation. The record will be 
                  moved to deleted donations and can be restored later by an admin.
                </p>
              </div>
            </div>
          </div>

          {/* Donation Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Donation Details</h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Donor:</span>
                <span className="font-medium text-gray-900">{donation.donorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Amount:</span>
                <span className="font-medium text-gray-900">{formatAmount(donation.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Date:</span>
                <span className="font-medium text-gray-900">{formatDate(donation.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Purpose:</span>
                <span className="font-medium text-gray-900">{donation.purpose}</span>
              </div>
              {donation.operator?.name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Recorded by:</span>
                  <span className="font-medium text-gray-900">{donation.operator.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deletion *
            </label>
            <textarea
              value={reason}
              onChange={handleReasonChange}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors ${
                errors.reason 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500/20'
              }`}
              placeholder="Please provide a reason for deleting this donation (5-500 characters)..."
              disabled={loading}
              autoFocus
            />
            {errors.reason && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                {errors.reason}
              </p>
            )}
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                This reason will be recorded in the audit log.
              </p>
              <span className={`text-xs ${
                reason.length > 500 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {reason.length}/500
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Donation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DeleteDonationModal