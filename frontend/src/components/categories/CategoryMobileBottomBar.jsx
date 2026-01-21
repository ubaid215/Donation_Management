import React from 'react'
import { Plus, Grid3x3, List, Download, Filter } from 'lucide-react'

const CategoryMobileBottomBar = ({ 
  viewMode, 
  onViewModeChange, 
  onAddClick, 
  onExportClick,
  isFiltersOpen,
  onToggleFilters
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 animate-slide-up">
      <div className="flex items-center justify-around">
        <button
          onClick={onAddClick}
          className="flex flex-col items-center p-2 text-blue-600"
          aria-label="Add category"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs mt-1">Add</span>
        </button>
        
        <button
          onClick={onViewModeChange}
          className="flex flex-col items-center p-2 text-gray-600"
          aria-label="Toggle view"
        >
          {viewMode === 'list' ? (
            <Grid3x3 className="w-5 h-5" />
          ) : (
            <List className="w-5 h-5" />
          )}
          <span className="text-xs mt-1">{viewMode === 'list' ? 'Grid' : 'List'}</span>
        </button>
        
        <button
          onClick={onExportClick}
          className="flex flex-col items-center p-2 text-gray-600"
          aria-label="Export"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs mt-1">Export</span>
        </button>
        
        <button
          onClick={onToggleFilters}
          className="flex flex-col items-center p-2 text-gray-600"
          aria-label="Filters"
        >
          <Filter className={`w-5 h-5 ${isFiltersOpen ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className="text-xs mt-1">Filters</span>
        </button>
      </div>
    </div>
  )
}

export default CategoryMobileBottomBar