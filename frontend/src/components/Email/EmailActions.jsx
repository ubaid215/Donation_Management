// components/EmailActions.jsx
import React, { useState } from 'react'
import { useDonations } from '../contexts/DonationContext'
import { getEmailStatusColor, getEmailStatusText } from '../utils/emailUtils'

// eslint-disable-next-line react-refresh/only-export-components
const EmailActions = ({ donation }) => {
  const { sendReceiptEmail, resendReceiptEmail, getEmailStatus, emailSending } = useDonations()
  const [customMessage, setCustomMessage] = useState('')
  const [showMessageInput, setShowMessageInput] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSendEmail = async () => {
    const result = await sendReceiptEmail(donation.id, customMessage)
    if (result.success) {
      setCustomMessage('')
      setShowMessageInput(false)
      // Refresh status
      const statusResult = await getEmailStatus(donation.id)
      if (statusResult.success) {
        setStatus(statusResult.status)
      }
    }
  }

  const handleResendEmail = async () => {
    const result = await resendReceiptEmail(donation.id, customMessage)
    if (result.success) {
      setCustomMessage('')
      setShowMessageInput(false)
    }
  }

  const loadEmailStatus = async () => {
    const result = await getEmailStatus(donation.id)
    if (result.success) {
      setStatus(result.status)
    }
  }

  return (
    <div className="space-y-3">
      {/* Email Status */}
      {status && (
        <div className={`p-3 border rounded-lg ${getEmailStatusColor(status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Email Status: </span>
              <span className="font-bold">{getEmailStatusText(status)}</span>
              {status.sentAt && (
                <div className="text-sm mt-1">
                  Sent on: {new Date(status.sentAt).toLocaleString()}
                </div>
              )}
            </div>
            <button
              onClick={loadEmailStatus}
              className="text-sm px-2 py-1 bg-gray-200 rounded"
              disabled={emailSending}
            >
              Refresh
            </button>
          </div>
          {status.error && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Error: </span>
              {status.error}
            </div>
          )}
        </div>
      )}

      {/* Email Actions */}
      <div className="flex flex-wrap gap-2">
        {(!donation.emailSent || status?.error) && donation.donorEmail && (
          <button
            onClick={handleSendEmail}
            disabled={emailSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {emailSending ? 'Sending...' : 'Send Receipt Email'}
          </button>
        )}

        {donation.emailSent && donation.donorEmail && (
          <button
            onClick={handleResendEmail}
            disabled={emailSending}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {emailSending ? 'Resending...' : 'Resend Email'}
          </button>
        )}

        <button
          onClick={() => setShowMessageInput(!showMessageInput)}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          {showMessageInput ? 'Cancel' : 'Add Custom Message'}
        </button>
      </div>

      {/* Custom Message Input */}
      {showMessageInput && (
        <div className="mt-3">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message to include in the email..."
            className="w-full p-3 border rounded-lg"
            rows="3"
            maxLength="1000"
          />
          <div className="text-sm text-gray-500 mt-1">
            {customMessage.length}/1000 characters
          </div>
        </div>
      )}

      {/* Email Preview */}
      {donation.donorEmail && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Recipient:</strong> {donation.donorEmail}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <strong>Subject:</strong> JazakAllah Khair for Your Donation - Rs {donation.amount} - Astana Foundation
          </div>
        </div>
      )}
    </div>
  )
}