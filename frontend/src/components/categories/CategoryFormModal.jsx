import React from 'react'
import { Tag, CheckCircle } from 'lucide-react'

const CategoryFormModal = ({ 
  type, 
  formData, 
  setFormData, 
  formErrors, 
  onSubmit, 
  onClose, 
  loading,
  category
}) => {
  const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#f97316', label: 'Orange' }
  ]

  const iconOptions = [
    { value: 'Tag', label: 'Tag' },
    { value: 'Home', label: 'Home' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Book', label: 'Book' },
    { value: 'DollarSign', label: 'Dollar' },
    { value: 'Users', label: 'Users' },
    { value: 'Building', label: 'Building' },
    { value: 'GraduationCap', label: 'Graduation' }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                {type === 'add' ? 'Create New Category' : 'Edit Category'}
              </h3>
              {category && category.id && (
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  ID: {category.id.substring(0, 8)}...
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 text-xl"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-3 md:space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`input text-xs md:text-sm py-2 ${formErrors.name ? 'input-error' : ''}`}
                placeholder="e.g., Temple Maintenance"
                maxLength={100}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`input text-xs md:text-sm py-2 min-h-[80px] ${formErrors.description ? 'input-error' : ''}`}
                placeholder="Brief description of this category..."
                maxLength={500}
                rows="3"
              />
              <div className="flex justify-between mt-1">
                {formErrors.description && (
                  <p className="text-xs text-red-600">{formErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>
            
            {/* Color & Icon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`h-8 rounded-lg flex items-center justify-center ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-blue-500' 
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                      aria-label={color.label}
                    >
                      {formData.color === color.value && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="input text-xs md:text-sm py-2"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-3 w-3 md:h-4 md:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-xs md:text-sm text-gray-900">
                Active Category
              </label>
            </div>
            
            {/* Preview */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: formData.color }}
                >
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-base font-medium text-gray-900">
                    {formData.name || 'Category Name'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {formData.description || 'No description'}
                  </div>
                </div>
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {/* Actions */}
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
                type="submit"
                disabled={loading}
                className="btn btn-primary text-xs md:text-sm py-2 px-3 md:px-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                    {type === 'add' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  type === 'add' ? 'Create Category' : 'Update Category'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CategoryFormModal