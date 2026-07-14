import React from 'react'
import { Mail, Phone, Calendar, Edit2, UserCheck, UserX, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'

const OperatorRow = ({ operator, onEdit, onToggleStatus }) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm md:text-base font-semibold text-blue-800">
              {operator.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm md:text-base font-medium text-gray-900">
              {operator.name}
            </div>
            <div className="text-xs text-gray-500">
              ID: {operator.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div>
          <div className="flex items-center text-sm text-gray-900">
            <Mail className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{operator.email}</span>
          </div>
          {operator.phone && (
            <div className="flex items-center mt-1 text-xs md:text-sm text-gray-500">
              <Phone className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-400 flex-shrink-0" />
              {operator.phone}
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`badge ${operator.isActive ? 'badge-success' : 'badge-danger'} text-xs`}>
          {operator.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="text-center">
          <span className="text-sm md:text-base font-semibold text-gray-900">
            {operator._count?.donations || 0}
          </span>
          <div className="text-xs text-gray-500">donations</div>
        </div>
      </td>
      <td className="py-3 px-4">
        {operator.lastLogin ? (
          <div className="flex items-center text-sm text-gray-900">
            <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-400 flex-shrink-0" />
            {format(new Date(operator.lastLogin), 'dd MMM yyyy')}
          </div>
        ) : (
          <span className="text-sm text-gray-500">Never</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-gray-900">
          {format(new Date(operator.createdAt), 'dd MMM yyyy')}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={onEdit}
            className="p-1.5 md:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edit"
          >
            <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          
          <button
            onClick={onToggleStatus}
            className={`p-1.5 md:p-2 rounded-lg ${operator.isActive 
              ? 'text-amber-600 hover:bg-amber-50' 
              : 'text-green-600 hover:bg-green-50'
            }`}
            title={operator.isActive ? 'Deactivate' : 'Activate'}
          >
            {operator.isActive ? <UserX className="w-3 h-3 md:w-4 md:h-4" /> : <UserCheck className="w-3 h-3 md:w-4 md:h-4" />}
          </button>
          
          <button className="p-1.5 md:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default OperatorRow