import React from 'react'
import { Trash2, AlertTriangle, Tag } from 'lucide-react'
import { format } from 'date-fns'

const CategoryDeleteModal = ({ category, onConfirm, onClose, loading }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Delete Category
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {category.id ? category.id.substring(0, 8) : 'N/A'}...
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 text-xl"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 md:p-4 bg-red-50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Warning: This action cannot be undone
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    Deleting this category will remove it permanently. 
                    {category.donationCount > 0 && (
                      <span className="font-semibold"> {category.donationCount} donations</span>
                    )} associated with this category will not be affected but will have no category assigned.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                >
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {category.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-xs md:text-sm text-gray-600 space-y-1">
              <p>📅 Created: {category.createdAt ? format(new Date(category.createdAt), 'PPP') : 'Unknown'}</p>
              <p>📊 Donations: {category.donationCount || 0}</p>
              <p>📈 Status: <span className={category.isActive ? 'text-green-600' : 'text-gray-600'}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span></p>
            </div>
            
            <div className="flex justify-end space-x-2 md:space-x-3 pt-4 md:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline text-xs md:text-sm py-2 px-3 md:px-4"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="btn btn-danger text-xs md:text-sm py-2 px-3 md:px-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryDeleteModal