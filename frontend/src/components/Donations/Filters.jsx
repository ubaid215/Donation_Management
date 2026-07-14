/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import useDonations from '../../hooks/useDonations'

const Filters = ({ onFilter, onClear, initialFilters = {} }) => {
  const { activeCategories } = useDonations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    purpose: initialFilters.purpose || '',
    paymentMethod: initialFilters.paymentMethod || '',
    minAmount: initialFilters.minAmount || '',
    maxAmount: initialFilters.maxAmount || '',
    emailStatus: initialFilters.emailStatus || '',
    ...initialFilters
  })
  const [categoryLoading, setCategoryLoading] = useState(false)

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  ]

  const emailStatusOptions = [
    { value: '', label: 'All' },
    { value: 'sent', label: 'Email Sent' },
    { value: 'not_sent', label: 'Email Not Sent' },
    { value: 'whatsapp_sent', label: 'WhatsApp Sent' },
    { value: 'whatsapp_not_sent', label: 'WhatsApp Not Sent' }
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
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
      emailStatus: ''
    }
    setFilters(clearedFilters)
    onClear()
  }

  const hasActiveFilters = Object.values(filters).some(
    value => value && value !== '' && (typeof value === 'string' ? value.trim() !== '' : true)
  )

  const getAppliedFilterCount = () => {
    return Object.values(filters).filter(v => 
      v && v !== '' && (typeof v === 'string' ? v.trim() !== '' : true)
    ).length
  }

  const formatAmount = (amount) => {
    if (!amount) return ''
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="card card-hover p-4 md:p-6 mb-4 md:mb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-base md:text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="ml-2 badge badge-info text-xs">
              {getAppliedFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="btn btn-outline text-sm py-1.5 px-3 md:py-2 md:px-4 hover:bg-gray-50"
              title="Clear all filters"
            >
              <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-outline text-sm py-1.5 px-3 md:py-2 md:px-4 hover:bg-gray-50 flex items-center"
            title={isExpanded ? "Show less filters" : "Show more filters"}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Less Filters</span>
                <span className="sm:hidden">Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">More Filters</span>
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
              className="input pl-9 md:pl-10 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Donor name, phone, or email..."
            />
          </div>
        </div>

        {/* Purpose/Category */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Category
          </label>
          <select
            value={filters.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="input py-2.5 md:py-2 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            disabled={categoryLoading}
          >
            <option value="">All Categories</option>
            {categoryLoading ? (
              <option value="" disabled>Loading categories...</option>
            ) : activeCategories.length > 0 ? (
              activeCategories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No categories available</option>
            )}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="input py-2.5 md:py-2 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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
            className="btn btn-primary w-full py-2.5 md:py-2 hover:bg-primary-700 active:bg-primary-800"
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
                <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1 text-gray-500" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="input hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1 text-gray-500" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="input hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Amount Range and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Min Amount */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Min Amount (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                  className="input pl-10 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Max Amount (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleChange('maxAmount', e.target.value)}
                  className="input pl-10 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Any"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Email Status */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Notification Status
              </label>
              <select
                value={filters.emailStatus}
                onChange={(e) => handleChange('emailStatus', e.target.value)}
                className="input py-2.5 md:py-2 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                {emailStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Quick Date Presets
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
                      // First day of current month
                      start.setDate(1)
                    } else if (preset.days === 'last_month') {
                      // First day of last month to last day of last month
                      start.setMonth(start.getMonth() - 1, 1)
                      end.setDate(0) // Last day of previous month
                    } else {
                      start.setDate(end.getDate() - preset.days)
                    }
                    
                    setFilters(prev => ({
                      ...prev,
                      startDate: format(start, 'yyyy-MM-dd'),
                      endDate: format(end, 'yyyy-MM-dd')
                    }))
                  }}
                  className="px-3 py-1.5 text-xs md:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  title={preset.label}
                >
                  <span className="hidden sm:inline">{preset.label}</span>
                  <span className="sm:hidden">{preset.mobile}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Applied Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Search: "{filters.search}"
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                From: {new Date(filters.startDate).toLocaleDateString()}
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                To: {new Date(filters.endDate).toLocaleDateString()}
              </span>
            )}
            {filters.purpose && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Category: {filters.purpose}
              </span>
            )}
            {filters.paymentMethod && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Payment: {paymentMethods.find(m => m.value === filters.paymentMethod)?.label}
              </span>
            )}
            {filters.minAmount && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Min: Rs {formatAmount(filters.minAmount)}
              </span>
            )}
            {filters.maxAmount && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Max: Rs {formatAmount(filters.maxAmount)}
              </span>
            )}
            {filters.emailStatus && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Status: {emailStatusOptions.find(s => s.value === filters.emailStatus)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Filters