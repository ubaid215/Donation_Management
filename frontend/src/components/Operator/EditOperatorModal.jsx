import React, { useState } from 'react'
import { format } from 'date-fns'

const EditOperatorModal = ({ operator, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: operator.name,
    phone: operator.phone || '',
    isActive: operator.isActive
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setSubmitting(true)
    await onSubmit(operator.id, formData)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Edit Operator</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 text-xl"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input text-xs md:text-sm py-2"
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="input text-xs md:text-sm py-2"
                placeholder="9876543210"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-3 w-3 md:h-4 md:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-xs md:text-sm text-gray-900">
                Active Account
              </label>
            </div>
            
            <div className="text-xs md:text-sm text-gray-500">
              <p className="font-medium mb-1">Current Status:</p>
              <p>Email: {operator.email}</p>
              <p>Donations: {operator._count?.donations || 0}</p>
              <p>Last Login: {operator.lastLogin ? format(new Date(operator.lastLogin), 'dd MMM yyyy') : 'Never'}</p>
            </div>
            
            <div className="flex justify-end space-x-2 md:space-x-3 pt-4 md:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline text-xs md:text-sm py-2 px-3 md:px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary text-xs md:text-sm py-2 px-3 md:px-4"
              >
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditOperatorModal