/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Search, 
  Filter,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  ChevronDown
} from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import auditService from '../services/auditService.js'
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx'
import Pagination from '../components/Common/Pagination.jsx'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const AuditLogs = () => {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    if (isAdmin()) {
      fetchLogs()
    }
  }, [filters, isAdmin])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await auditService.getLogs(filters)
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    handleFilterChange('page', page)
  }

  const handlePageSizeChange = (limit) => {
    handleFilterChange('limit', limit)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    })
    setIsFiltersOpen(false)
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'DONATION_CREATED':
        return <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
      case 'USER_LOGIN':
        return <User className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
      case 'PDF_EXPORTED':
        return <Activity className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
      case 'USER_CREATED':
        return <User className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
      case 'USER_UPDATED':
        return <Activity className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
      default:
        return <Activity className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'DONATION_CREATED':
        return 'bg-green-100 text-green-800'
      case 'USER_LOGIN':
        return 'bg-blue-100 text-blue-800'
      case 'PDF_EXPORTED':
        return 'bg-amber-100 text-amber-800'
      case 'USER_CREATED':
        return 'bg-green-100 text-green-800'
      case 'USER_UPDATED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAction = (action) => {
    return action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const hasActiveFilters = Object.values(filters).some(
    value => value && value !== '' && typeof value !== 'number'
  )

  if (!isAdmin()) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
        </div>
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
          Audit logs are only available for administrators
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Audit Logs
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Security audit trail of all system activities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
          <span className="text-xs md:text-sm text-gray-600">
            {pagination.total.toLocaleString()} total entries
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-hover p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2" />
            <h3 className="text-sm md:text-base font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="ml-2 badge badge-info text-xs">
                {Object.values(filters).filter(v => v && v !== '' && typeof v !== 'number').length} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-outline text-xs py-1.5 px-2 md:py-2 md:px-3"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="btn btn-outline text-xs py-1.5 px-2 md:py-2 md:px-3 lg:hidden"
            >
              {isFiltersOpen ? 'Show Less' : 'More Filters'}
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
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
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-8 md:pl-10 text-xs md:text-sm py-2"
                placeholder="Search logs..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="input text-xs md:text-sm py-2"
            >
              <option value="">All Actions</option>
              <option value="DONATION_CREATED">Donation Created</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="PDF_EXPORTED">PDF Exported</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {(isFiltersOpen || window.innerWidth >= 1024) && (
          <div className={`mt-4 pt-4 border-t border-gray-200 ${!isFiltersOpen && window.innerWidth < 1024 ? 'hidden' : 'animate-slide-up'}`}>
            <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-3">Date Range</h4>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input text-xs md:text-sm py-2"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input text-xs md:text-sm py-2"
                />
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Quick Filters
              </label>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {[
                  { label: 'Today', days: 0, mobile: 'Today' },
                  { label: 'Last 7 Days', days: 7, mobile: '7D' },
                  { label: 'Last 30 Days', days: 30, mobile: '30D' },
                  { label: 'This Month', days: 'month', mobile: 'Month' }
                ].map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => {
                      const end = new Date()
                      const start = new Date()
                      
                      if (filter.days === 'month') {
                        start.setDate(1)
                      } else {
                        start.setDate(end.getDate() - filter.days)
                      }
                      
                      handleFilterChange('startDate', format(start, 'yyyy-MM-dd'))
                      handleFilterChange('endDate', format(end, 'yyyy-MM-dd'))
                    }}
                    className="px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.mobile}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs */}
      <div className="card card-hover overflow-hidden">
        {loading ? (
          <div className="py-8 md:py-12">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 md:py-12 animate-fade-in">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-sm md:text-base text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden">
              <div className="p-3 space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <div className="ml-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {formatAction(log.action)}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(log.timestamp), 'dd MMM, hh:mm a')}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start">
                        <User className="w-3 h-3 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">{log.user?.name || 'System'}</span>
                          <p className="text-gray-600 mt-1">{log.description}</p>
                        </div>
                      </div>

                      {log.metadata && (
                        <div className="bg-gray-100 p-2 rounded text-gray-600 overflow-x-auto">
                          <code className="text-xs whitespace-pre">
                            {JSON.stringify(log.metadata, null, 2)}
                          </code>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div>
                          <div className="text-gray-500">IP Address</div>
                          <code className="text-xs font-medium text-gray-900">
                            {log.ipAddress || 'N/A'}
                          </code>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500">ID</div>
                          <code className="text-xs text-gray-600 truncate max-w-[80px]">
                            {log.id.substring(0, 8)}...
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Timestamp</th>
                      <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Action</th>
                      <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center text-gray-900">
                            <Clock className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm md:text-base font-medium">
                                {format(new Date(log.timestamp), 'dd MMM yyyy')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(log.timestamp), 'hh:mm:ss a')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getActionIcon(log.action)}
                            <span className={`ml-2 badge ${getActionColor(log.action)} text-xs`}>
                              {formatAction(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm md:text-base font-medium text-gray-900">
                              {log.user?.name || 'System'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.user?.role || 'SYSTEM'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs lg:max-w-md">
                            <p className="text-sm text-gray-900 line-clamp-2">{log.description}</p>
                            {log.metadata && (
                              <div className="mt-1 text-xs text-gray-500 truncate">
                                {JSON.stringify(log.metadata)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                            {log.ipAddress || 'N/A'}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
              pageSize={pagination.limit}
              onPageSizeChange={handlePageSizeChange}
              totalItems={pagination.total}
            />
          </>
        )}
      </div>

      {/* Mobile Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 animate-slide-up">
        <div className="flex items-center justify-around">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center p-2 text-gray-600"
            aria-label="Scroll to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-xs mt-1">Top</span>
          </button>
          
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex flex-col items-center p-2 text-gray-600"
            aria-label="Filters"
          >
            <Filter className={`w-5 h-5 ${isFiltersOpen ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className="text-xs mt-1">Filters</span>
          </button>
          
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="flex flex-col items-center p-2 disabled:opacity-50"
            aria-label="Clear filters"
          >
            <X className="w-5 h-5 text-gray-600" />
            <span className="text-xs mt-1">Clear</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuditLogs