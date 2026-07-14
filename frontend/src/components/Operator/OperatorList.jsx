import React from 'react'
import { Users } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import Pagination from '../Common/Pagination.jsx'
import OperatorCard from './OperatorCard.jsx'
import OperatorRow from './OperatorRow.jsx'

const OperatorList = ({
  operators,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus
}) => {
  if (loading) {
    return (
      <div className="card py-8 md:py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (operators.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8 md:py-12 animate-fade-in">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No operators found</h3>
          <p className="text-sm md:text-base text-gray-500">Add your first operator to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-hover overflow-hidden">
      {/* Mobile View */}
      <div className="block md:hidden">
        <div className="p-3 space-y-3">
          {operators.map((operator) => (
            <OperatorCard
              key={operator.id}
              operator={operator}
              onEdit={() => onEdit(operator)}
              onToggleStatus={() => onToggleStatus(operator)}
            />
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Operator</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Contact</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Donations</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Last Login</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operators.map((operator) => (
                <OperatorRow
                  key={operator.id}
                  operator={operator}
                  onEdit={() => onEdit(operator)}
                  onToggleStatus={() => onToggleStatus(operator)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={onPageChange}
        pageSize={pagination.limit}
        onPageSizeChange={onPageSizeChange}
        totalItems={pagination.total}
      />
    </div>
  )
}

export default OperatorList