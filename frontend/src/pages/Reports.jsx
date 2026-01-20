/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Printer,
  Mail,
  Clock,
  ChevronDown,
  X,
  Check
} from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import donationService from '../services/donationService.js'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Reports = () => {
  const { isAdmin } = useAuth()
  const [reportType, setReportType] = useState('donations')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    purpose: '',
    paymentMethod: ''
  })
  const [generating, setGenerating] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerateReport = async () => {
    if (!isAdmin()) {
      toast.error('Only administrators can generate reports')
      return
    }

    try {
      setGenerating(true)
      const response = await donationService.exportReport(filters)
      
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrintPreview = () => {
    toast.info('Print preview coming soon')
  }

  const handleEmailReport = () => {
    toast.info('Email report feature coming soon')
  }

  if (!isAdmin()) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
        </div>
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
          Report generation is only available for administrators
        </p>
      </div>
    )
  }

  const reportTypes = [
    { id: 'donations', label: 'Donation Report', description: 'Detailed list of donations', icon: FileText },
    { id: 'analytics', label: 'Analytics Report', description: 'Charts and insights overview', icon: FileText },
    { id: 'audit', label: 'Audit Report', description: 'System activity and security logs', icon: FileText },
    { id: 'summary', label: 'Monthly Summary', description: 'Executive summary report', icon: FileText }
  ]

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

  const datePresets = [
    { label: 'Today', days: 0, mobile: 'Today' },
    { label: 'Last 7 Days', days: 7, mobile: '7D' },
    { label: 'Last 30 Days', days: 30, mobile: '30D' },
    { label: 'This Month', days: 'month', mobile: 'Month' },
    { label: 'Last Month', days: 'last_month', mobile: 'Last M' }
  ]

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Reports & Exports
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Generate detailed reports and export data in multiple formats
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
          <span className="text-xs md:text-sm text-gray-500">
            Last: Today, 10:30 AM
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Report Type Selection - Mobile Dropdown */}
        <div className="lg:hidden">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Report Type</h3>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input pr-8 text-sm py-2 w-full appearance-none"
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {reportTypes.find(t => t.id === reportType)?.description}
            </p>
          </div>
        </div>

        {/* Report Type Selection - Desktop */}
        <div className="hidden lg:block">
          <div className="card card-hover p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4">Report Type</h3>
            <div className="space-y-2 md:space-y-3">
              {reportTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`w-full p-3 md:p-4 rounded-lg border text-left transition-colors ${
                      reportType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`
                        p-2 rounded-full mr-3 flex-shrink-0
                        ${reportType === type.id ? 'bg-blue-100' : 'bg-gray-100'}
                      `}>
                        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${
                          reportType === type.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">
                          {type.label}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                          {type.description}
                        </p>
                      </div>
                      {reportType === type.id && (
                        <div className="ml-auto flex-shrink-0">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="lg:col-span-2">
          {/* Filters Card */}
          <div className="card card-hover p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div className="flex items-center">
                <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2" />
                <h3 className="text-sm md:text-base font-semibold text-gray-800">Report Filters</h3>
              </div>
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="btn btn-outline text-xs py-1.5 px-2 md:py-2 md:px-3 lg:hidden"
              >
                {isFiltersOpen ? (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Filter className="w-3 h-3 mr-1" />
                    Filters
                  </>
                )}
              </button>
            </div>

            {/* Basic Filters - Always Visible on Desktop */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
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
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input text-xs md:text-sm py-2"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Purpose
                </label>
                <select
                  value={filters.purpose}
                  onChange={(e) => handleFilterChange('purpose', e.target.value)}
                  className="input text-xs md:text-sm py-2"
                >
                  <option value="">All Purposes</option>
                  {donationPurposes.map(purpose => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="input text-xs md:text-sm py-2"
                >
                  <option value="">All Methods</option>
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Filters - Collapsible */}
            <div className={`lg:hidden ${isFiltersOpen ? 'block animate-slide-up' : 'hidden'}`}>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="input text-xs py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="input text-xs py-2"
                  />
                </div>

                <div className="xs:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <select
                    value={filters.purpose}
                    onChange={(e) => handleFilterChange('purpose', e.target.value)}
                    className="input text-xs py-2"
                  >
                    <option value="">All Purposes</option>
                    {donationPurposes.map(purpose => (
                      <option key={purpose} value={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>

                <div className="xs:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="input text-xs py-2"
                  >
                    <option value="">All Methods</option>
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Quick Date Ranges
              </label>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {datePresets.map((preset) => (
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

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="btn btn-primary text-xs md:text-sm py-2.5 md:py-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            
            <button
              onClick={handlePrintPreview}
              className="btn btn-outline text-xs md:text-sm py-2.5 md:py-2"
            >
              <Printer className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span>Print Preview</span>
            </button>
            
            <button
              onClick={handleEmailReport}
              className="btn btn-outline text-xs md:text-sm py-2.5 md:py-2"
            >
              <Mail className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span>Email Report</span>
            </button>
          </div>

          {/* Report Preview */}
          <div className="card card-hover p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">Report Preview</h3>
              <div className="text-xs text-gray-500 hidden sm:block">
                {reportTypes.find(t => t.id === reportType)?.label}
              </div>
            </div>
            
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="text-center py-6 md:py-8 text-gray-500">
                <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                </div>
                <p className="text-xs md:text-sm">Report preview will appear here after generation</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>Format: PDF | Pages: Dynamic</p>
                  <p className="sm:hidden">Includes all selected filters</p>
                </div>
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">PDF</div>
                    <div className="text-gray-500">Format</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">~10</div>
                    <div className="text-gray-500">Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">A4</div>
                    <div className="text-gray-500">Size</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">5MB</div>
                    <div className="text-gray-500">Size</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 animate-slide-up">
        <div className="flex items-center justify-around">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex flex-col items-center p-2 disabled:opacity-50"
            aria-label="Generate report"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <Download className="w-5 h-5 text-blue-600" />
            )}
            <span className="text-xs mt-1">Generate</span>
          </button>
          
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex flex-col items-center p-2"
            aria-label="Filters"
          >
            <Filter className={`w-5 h-5 ${isFiltersOpen ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className="text-xs mt-1">Filters</span>
          </button>
          
          <button
            onClick={handlePrintPreview}
            className="flex flex-col items-center p-2"
            aria-label="Print"
          >
            <Printer className="w-5 h-5 text-gray-600" />
            <span className="text-xs mt-1">Print</span>
          </button>
          
          <button
            onClick={handleEmailReport}
            className="flex flex-col items-center p-2"
            aria-label="Email"
          >
            <Mail className="w-5 h-5 text-gray-600" />
            <span className="text-xs mt-1">Email</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports