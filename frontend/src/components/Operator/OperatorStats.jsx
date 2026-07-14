import React from 'react'
import { Users, UserCheck, UserX } from 'lucide-react'

const OperatorStats = ({ operators }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      <div className="card p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500">Total</p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
              {operators.length}
            </p>
          </div>
          <div className="p-2 md:p-3 bg-blue-50 rounded-full">
            <Users className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="card p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500">Active</p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
              {operators.filter(op => op.isActive).length}
            </p>
          </div>
          <div className="p-2 md:p-3 bg-green-50 rounded-full">
            <UserCheck className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="col-span-2 md:col-span-1 card p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500">Inactive</p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
              {operators.filter(op => !op.isActive).length}
            </p>
          </div>
          <div className="p-2 md:p-3 bg-gray-100 rounded-full">
            <UserX className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperatorStats