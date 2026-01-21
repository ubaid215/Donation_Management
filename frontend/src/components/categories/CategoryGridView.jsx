import React from 'react'
import { Tag, Edit2, Trash2, Eye, EyeOff, MoreVertical, Users } from 'lucide-react'

const CategoryGridView = ({ categories, onEdit, onDelete, onToggleStatus }) => {
  const toggleMenu = (categoryId) => {
    const menu = document.getElementById(`menu-${categoryId}`)
    if (menu) {
      // Close all other menus
      document.querySelectorAll('[id^="menu-"]').forEach(m => {
        if (m.id !== `menu-${categoryId}`) m.classList.add('hidden')
      })
      menu.classList.toggle('hidden')
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category) => {
        // Get donation count from either _count or donationCount property
        const donationCount = category._count?.donations || category.donationCount || 0
        
        return (
          <div key={category.id} className="card card-hover p-4 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center min-w-0 flex-1">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                >
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {category.name}
                  </h4>
                  <span 
                    className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => toggleMenu(category.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <div 
                  id={`menu-${category.id}`}
                  className="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                >
                  <button
                    onClick={() => {
                      toggleMenu(category.id)
                      onEdit(category)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center rounded-t-lg"
                  >
                    <Edit2 className="w-3 h-3 mr-2" />
                    Edit Category
                  </button>
                  <button
                    onClick={() => {
                      toggleMenu(category.id)
                      onToggleStatus(category)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    {category.isActive ? (
                      <>
                        <EyeOff className="w-3 h-3 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-2" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      toggleMenu(category.id)
                      onDelete(category)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center rounded-b-lg"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete Category
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
              {category.description || 'No description provided'}
            </p>
            
            {/* Donation Statistics */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Donation Statistics</span>
                <Users className="w-3 h-3 text-gray-500" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {donationCount}
                    </div>
                    <div className="text-xs text-gray-600">Total Donations</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {category._sum?.amount 
                        ? `Rs ${Number(category._sum.amount).toLocaleString()}` 
                        : 'Rs 0'
                      }
                    </div>
                    <div className="text-xs text-gray-600">Total Amount</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="truncate">ID: {category.id ? category.id.substring(0, 8) : 'N/A'}...</span>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-900">
                    {category.createdAt 
                      ? new Date(category.createdAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                  <div className="text-[10px] text-gray-500">Created</div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CategoryGridView