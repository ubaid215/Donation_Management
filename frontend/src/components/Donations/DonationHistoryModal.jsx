/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { X, Clock, User, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { useDonations } from '../../context/DonationContext.jsx'

const DonationHistoryModal = ({ donationId, onClose }) => {
  const { getDonationHistory, donationHistory } = useDonations()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (donationId && !donationHistory[donationId]) {
      fetchHistory()
    }
  }, [donationId])

  const fetchHistory = async () => {
    setLoading(true)
    await getDonationHistory(donationId)
    setLoading(false)
  }

  const history = donationHistory[donationId] || []

  const getActionIcon = (action) => {
    switch (action) {
      case 'DONATION_CREATED':
        return <Clock className="h-4 w-4 text-green-500" />
      case 'DONATION_UPDATED':
        return <User className="h-4 w-4 text-blue-500" />
      case 'EMAIL_SENT':
      case 'EMAIL_RESENT':
        return <Mail className="h-4 w-4 text-purple-500" />
      case 'WHATSAPP_SENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'EMAIL_FAILED':
      case 'WHATSAPP_FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'DONATION_DELETED':
        return <X className="h-4 w-4 text-red-500" />
      case 'DONATION_RESTORED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionText = (action) => {
    switch (action) {
      case 'DONATION_CREATED': return 'Donation Created'
      case 'DONATION_UPDATED': return 'Donation Updated'
      case 'EMAIL_SENT': return 'Email Sent'
      case 'EMAIL_RESENT': return 'Email Resent'
      case 'EMAIL_FAILED': return 'Email Failed'
      case 'WHATSAPP_SENT': return 'WhatsApp Sent'
      case 'WHATSAPP_FAILED': return 'WhatsApp Failed'
      case 'DONATION_DELETED': return 'Donation Deleted'
      case 'DONATION_RESTORED': return 'Donation Restored'
      default: return action
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Donation History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No history available for this donation
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getActionIcon(item.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {getActionText(item.action)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                      
                      {item.user && (
                        <div className="text-sm text-gray-500 mt-2">
                          By {item.user.name} ({item.user.role})
                        </div>
                      )}
                      
                      {item.metadata && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DonationHistoryModal