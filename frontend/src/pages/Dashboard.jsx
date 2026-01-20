/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect,  } from 'react'
import { 
  TrendingUp, 
  Users, 
  IndianRupee, 
  Calendar,
  Download,
  Filter,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import MetricCard from '../components/Dashboard/MetricCard.jsx'
import DonationChart from '../components/dashboard/DonationChart.jsx'
import TopDonors from '../components/dashboard/TopDonors.jsx'
import donationService from '../services/donationService.js'
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [timeframe, setTimeframe] = useState('month')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate() 

  useEffect(() => {
    loadAnalytics()
  }, [timeframe])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await donationService.getAnalytics(timeframe)
      
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(true)
      const response = await donationService.exportReport({ timeframe })
      
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  // Function to refresh data
  const handleRefresh = () => {
    loadAnalytics()
    toast.success('Data refreshed')
  }

  // Function to handle add donation
  const handleAddDonation = () => {
    // You'll need to implement navigation to add donation page
    console.log('Navigate to add donation page')
     navigate('/donations')
  }

  if (loading || !analytics) {
    return <LoadingSpinner fullScreen />
  }

  // Extract metrics for quick access
  const metrics = analytics.metrics || {}
  const charts = analytics.charts || {}
  const topDonors = analytics.topDonors || []

  return (
    <div className="space-y-6 animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-in">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Welcome back, <span className="font-medium text-gray-800">{user?.name || 'User'}</span>. 
            <span className="hidden sm:inline"> Here's what's happening today.</span>
            <span className="sm:hidden"> Today's summary.</span>
          </p>
          
          {/* Quick Stats - Mobile Only */}
          <div className="sm:hidden mt-3 grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700">Today</div>
              <div className="text-lg font-bold text-gray-900">
                RS {metrics.todayAmount?.toLocaleString('en-PK') || '0'}
              </div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-700">Donors</div>
              <div className="text-lg font-bold text-gray-900">
                {metrics.todayDonors || 0}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
          {/* Timeframe Selector */}
          <div className="relative flex-1 xs:flex-initial">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="input pr-8 py-2.5 md:py-2 w-full xs:w-auto"
              aria-label="Select timeframe"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Export Button */}
          {isAdmin() && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className={`
                btn ${exporting ? 'btn-outline opacity-70' : 'btn-outline'} 
                flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-2
              `}
              aria-label={exporting ? 'Exporting report' : 'Export PDF report'}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm md:text-base">
                    <span className="hidden sm:inline">Exporting</span>
                    <span className="sm:hidden">Exporting</span>
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="text-sm md:text-base">
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">Export</span>
                  </span>
                </>
              )}
            </button>
          )}
          
          {/* Quick Actions - Desktop Only */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="btn btn-outline p-2"
              title="Refresh data"
              aria-label="Refresh dashboard data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              onClick={handleAddDonation}
              className="btn btn-primary flex items-center gap-1.5 py-2"
              aria-label="Add new donation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden lg:inline">Add Donation</span>
              <span className="lg:hidden">Add</span>
            </button>
          </div>
        </div>
        
        {/* Quick Actions - Mobile Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 animate-slide-up">
          <div className="flex items-center justify-around">
            <button
              onClick={handleAddDonation}
              className="flex flex-col items-center p-2 text-blue-600"
              aria-label="Add donation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs mt-1">Add</span>
            </button>
            
            <button
              onClick={handleRefresh}
              className="flex flex-col items-center p-2 text-gray-600"
              aria-label="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs mt-1">Refresh</span>
            </button>
            
            {isAdmin() && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex flex-col items-center p-2 text-gray-600 disabled:opacity-50"
                aria-label="Export"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs mt-1">Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Total Donations"
          value={(metrics.totalDonations || 0).toLocaleString()}
          change="+12%"
          icon={<TrendingUp className="w-5 h-5" />}
          color="primary"
        />
        
        <MetricCard
          title="Total Amount"
          value={`RS ${(metrics.totalAmount || 0).toLocaleString('en-PK')}`}
          change="+8%"
          icon={<DollarSign className="w-5 h-5" />}
          color="success"
        />
        
        <MetricCard
          title="Today's Donations"
          value={metrics.todayCount || 0}
          subValue={`RS ${(metrics.todayAmount || 0).toLocaleString('en-PK')}`}
          icon={<Calendar className="w-5 h-5" />}
          color="warning"
        />
        
        <MetricCard
          title="Active Operators"
          value={metrics.activeOperators || 0}
          icon={<Users className="w-5 h-5" />}
          color="gray"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card card-hover p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">
              Donations Trend
            </h3>
            <span className="text-xs md:text-sm text-gray-500">
              Last 30 days
            </span>
          </div>
          {charts.byDay && charts.byDay.length > 0 ? (
            <DonationChart 
              data={charts.byDay} 
              type="line" 
              title=""
            />
          ) : (
            <div className="text-center text-gray-500 py-8">No data available</div>
          )}
        </div>
        
        <div className="card card-hover p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">
              Donations by Purpose
            </h3>
            <span className="text-xs md:text-sm text-gray-500">
              Distribution
            </span>
          </div>
          {charts.byPurpose && charts.byPurpose.length > 0 ? (
            <DonationChart 
              data={charts.byPurpose} 
              type="pie" 
              title=""
            />
          ) : (
            <div className="text-center text-gray-500 py-8">No data available</div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Top Donors */}
        <div className="lg:col-span-2 card card-hover p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">Top Donors</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Highest contributors this {timeframe}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </div>
          </div>
          {topDonors && topDonors.length > 0 ? (
            <TopDonors donors={topDonors} />
          ) : (
            <div className="text-center text-gray-500 py-8">No donors yet</div>
          )}
        </div>

        {/* Operator Performance */}
        <div className="card card-hover p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">
              Operator Performance
            </h3>
            <span className="text-xs md:text-sm text-gray-500">
              This {timeframe}
            </span>
          </div>
          {charts.byOperator && charts.byOperator.length > 0 ? (
            <DonationChart 
              data={charts.byOperator} 
              type="bar" 
              title=""
            />
          ) : (
            <div className="text-center text-gray-500 py-8">No data available</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard