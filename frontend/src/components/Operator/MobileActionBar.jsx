import React from 'react'
import { UserPlus, Download, Filter } from 'lucide-react'

const MobileActionBar = ({ onAdd, onExport, onFilter }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 animate-slide-up">
      <div className="flex items-center justify-around">
        <button
          onClick={onAdd}
          className="flex flex-col items-center p-2 text-blue-600"
          aria-label="Add operator"
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-xs mt-1">Add</span>
        </button>
        
        <button
          onClick={onExport}
          className="flex flex-col items-center p-2 text-gray-600"
          aria-label="Export"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs mt-1">Export</span>
        </button>
        
        <button
          onClick={onFilter}
          className="flex flex-col items-center p-2 text-gray-600"
          aria-label="Filters"
        >
          <Filter className="w-5 h-5" />
          <span className="text-xs mt-1">Filter</span>
        </button>
      </div>
    </div>
  )
}

export default MobileActionBar