import React, { useState } from 'react'
import { Filter, Search, ChevronDown } from 'lucide-react'

const CategoryFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <div className="card card-hover p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center">
          <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2" />
          <h3 className="text-sm md:text-base font-medium text-gray-900">Filters</h3>
        </div>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="btn btn-outline text-xs py-1.5 px-2 md:py-2 md:px-3"
        >
          {isFiltersOpen ? 'Show Less' : 'More Filters'}
          <ChevronDown 
            className={`w-3 h-3 ml-1 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {/* Search */}
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
              placeholder="Search categories..."
            />
          </div>
        </div>

        {/* Status */}
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

        {/* Sort By */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Sort By
          </label>
          <select className="input text-xs md:text-sm py-2">
            <option>Name A-Z</option>
            <option>Newest First</option>
            <option>Most Used</option>
          </select>
        </div>
      </div>

      {/* Extended Filters */}
      {isFiltersOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-up">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Created After
              </label>
              <input
                type="date"
                className="input text-xs md:text-sm py-2"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Created Before
              </label>
              <input
                type="date"
                className="input text-xs md:text-sm py-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={onClearFilters}
                className="btn btn-outline text-xs md:text-sm w-full py-2"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryFilters