    import React from 'react'
import { Mail, Phone, Calendar, Edit2, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'

const OperatorCard = ({ operator, onEdit, onToggleStatus }) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-800">
              {operator.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {operator.name}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${operator.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {operator.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleStatus}
            className={`p-1.5 rounded ${operator.isActive 
              ? 'text-amber-600 hover:bg-amber-50' 
              : 'text-green-600 hover:bg-green-50'
            }`}
          >
            {operator.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center text-gray-600">
          <Mail className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">{operator.email}</span>
        </div>
        {operator.phone && (
          <div className="flex items-center text-gray-600">
            <Phone className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
            <span>{operator.phone}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {operator._count?.donations || 0}
            </div>
            <div className="text-gray-500">donations</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-600">
              {operator.lastLogin ? (
                <>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {format(new Date(operator.lastLogin), 'dd MMM')}
                </>
              ) : 'Never'}
            </div>
            <div className="text-gray-500 text-xs">
              Joined: {format(new Date(operator.createdAt), 'dd MMM')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperatorCard