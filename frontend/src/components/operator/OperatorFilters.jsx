import React from 'react'
import { Search, Filter, ChevronDown } from 'lucide-react'

const OperatorFilters = ({ filters, isFiltersOpen, onFilterChange, onToggleFilters }) => {
  return (
    <div className="card p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center">
          <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2" />
          <h3 className="text-sm md:text-base font-medium text-gray-900">Filters</h3>
        </div>
        <button
          onClick={onToggleFilters}
          className="btn btn-outline text-xs py-1.5 px-2 md:py-2 md:px-3"
        >
          {isFiltersOpen ? 'Hide' : 'More'}
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="input pl-8 md:pl-10 text-xs md:text-sm py-2"
              placeholder="Name or email..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Status
          </label>
          <select
            value={filters.isActive}
            onChange={(e) => onFilterChange('isActive', e.target.value)}
            className="input text-xs md:text-sm py-2"
          >
            <option value="">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {isFiltersOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-up">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Sort By
              </label>
              <select className="input text-xs md:text-sm py-2">
                <option>Recent Activity</option>
                <option>Name A-Z</option>
                <option>Most Donations</option>
                <option>Last Login</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Date From
              </label>
              <input
                type="date"
                className="input text-xs md:text-sm py-2"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Date To
              </label>
              <input
                type="date"
                className="input text-xs md:text-sm py-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperatorFilters