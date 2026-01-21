import React from 'react'
import { Tag, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import Pagination from '../Common/Pagination.jsx'

const CategoryListView = ({ 
  categories, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  pagination,
  onPageChange,
  onPageSizeChange,
  totalItems
}) => {
  return (
    <div className="card card-hover overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">
                Category
              </th>
              <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">
                Description
              </th>
              <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">
                Donations
              </th>
              <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">
                Created
              </th>
              <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                      style={{ backgroundColor: category.color || '#3b82f6' }}
                    >
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm md:text-base font-medium text-gray-900 truncate">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        ID: {category.id ? category.id.substring(0, 8) : 'N/A'}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-600 max-w-xs truncate">
                    {category.description || '—'}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <span 
                    className={`badge ${
                      category.isActive ? 'badge-success' : 'badge-danger'
                    } text-xs`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-center">
                    <span className="text-sm md:text-base font-semibold text-gray-900">
                      {category.donationCount || 0}
                    </span>
                    <div className="text-xs text-gray-500">donations</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-900">
                    {category.createdAt 
                      ? format(new Date(category.createdAt), 'dd MMM yyyy') 
                      : '—'
                    }
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="p-1.5 md:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    
                    <button
                      onClick={() => onToggleStatus(category)}
                      className={`p-1.5 md:p-2 rounded-lg ${
                        category.isActive 
                          ? 'text-amber-600 hover:bg-amber-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={category.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {category.isActive ? (
                        <EyeOff className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => onDelete(category)}
                      className="p-1.5 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {categories.length > 0 && pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={onPageChange}
          pageSize={pagination.limit}
          onPageSizeChange={onPageSizeChange}
          totalItems={totalItems}
        />
      )}
    </div>
  )
}

export default CategoryListView