import React, { useState } from 'react'
import { Search, Filter, Calendar, X } from 'lucide-react'
import { format } from 'date-fns'

const Filters = ({ onFilter, onClear, initialFilters = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    purpose: initialFilters.purpose || '',
    paymentMethod: initialFilters.paymentMethod || '',
    ...initialFilters
  })

  const donationPurposes = [
    'Temple Maintenance',
    'Charity Programs',
    'Educational Support',
    'Medical Assistance',
    'Festival Celebrations',
    'Food Distribution',
    'Infrastructure Development',
    'Emergency Relief'
  ]

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' }
  ]

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    onFilter(filters)
  }

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      startDate: '',
      endDate: '',
      purpose: '',
      paymentMethod: ''
    }
    setFilters(clearedFilters)
    onClear()
  }

  const hasActiveFilters = Object.values(filters).some(
    value => value && value !== ''
  )

  return (
    <div className="card card-hover p-4 md:p-6 mb-4 md:mb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-base md:text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="ml-2 badge badge-info text-xs">
              {Object.values(filters).filter(v => v && v !== '').length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="btn btn-outline text-sm py-1.5 px-3 md:py-2 md:px-4"
            >
              <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-outline text-sm py-1.5 px-3 md:py-2 md:px-4"
          >
            {isExpanded ? (
              <>
                <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Show Less</span>
                <span className="sm:hidden">Less</span>
              </>
            ) : (
              <>
                <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Show More</span>
                <span className="sm:hidden">More</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Filters - Always visible */}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="input pl-9 md:pl-10"
              placeholder="Name or phone..."
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Purpose
          </label>
          <select
            value={filters.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="input py-2.5 md:py-2"
          >
            <option value="">All Purposes</option>
            {donationPurposes.map(purpose => (
              <option key={purpose} value={purpose}>{purpose}</option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Payment
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="input py-2.5 md:py-2"
          >
            <option value="">All Methods</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <div className="flex items-end">
          <button
            onClick={handleApply}
            className="btn btn-primary w-full py-2.5 md:py-2"
          >
            <span className="hidden sm:inline">Apply Filters</span>
            <span className="sm:hidden">Apply</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="pt-4 border-t border-gray-200 animate-slide-up">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h4>
          
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Quick Dates
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Today', days: 0, mobile: 'Today' },
                { label: 'Last 7 Days', days: 7, mobile: '7D' },
                { label: 'Last 30 Days', days: 30, mobile: '30D' },
                { label: 'This Month', days: 'month', mobile: 'Month' },
                { label: 'Last Month', days: 'last_month', mobile: 'Last M' }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const end = new Date()
                    const start = new Date()
                    
                    if (preset.days === 'month') {
                      start.setDate(1)
                    } else if (preset.days === 'last_month') {
                      start.setMonth(start.getMonth() - 1, 1)
                      end.setDate(0)
                    } else {
                      start.setDate(end.getDate() - preset.days)
                    }
                    
                    setFilters(prev => ({
                      ...prev,
                      startDate: format(start, 'yyyy-MM-dd'),
                      endDate: format(end, 'yyyy-MM-dd')
                    }))
                  }}
                  className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <span className="hidden sm:inline">{preset.label}</span>
                  <span className="sm:hidden">{preset.mobile}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Filters