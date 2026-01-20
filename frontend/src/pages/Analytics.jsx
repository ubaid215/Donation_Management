import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users,
  Download,
  Calendar,
  Filter
} from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import adminService from '../services/adminService.js'
import DonationChart from '../components/dashboard/DonationChart.jsx'
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx'
import toast from 'react-hot-toast'

const Analytics = () => {
  const { isAdmin } = useAuth()
  const [insights, setInsights] = useState(null)
  const [timeframe, setTimeframe] = useState('month')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isAdmin()) {
      loadInsights()
    }
  }, [timeframe, isAdmin])

  const loadInsights = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDonationInsights(timeframe)
      console.log('Insights data:', data) // Debug log
      setInsights(data.insights)
    } catch (error) {
      console.error('Error loading insights:', error)
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-500">Analytics dashboard is only available for administrators</p>
      </div>
    )
  }

  if (loading || !insights) {
    return <LoadingSpinner fullScreen />
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'performance', label: 'Performance', icon: Users }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">
            Deep insights and detailed analysis of donation patterns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <button className="btn btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Metrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Amount', value: `RS ${(insights?.overview?.totalAmount || 0).toLocaleString('en-PK')}` },
                { label: 'Donation Count', value: (insights?.overview?.donationCount || 0).toLocaleString() },
                { label: 'Average Donation', value: `RS ${(insights?.overview?.avgDonation || 0).toLocaleString('en-PK')}` },
                { label: 'Maximum Donation', value: `RS ${(insights?.overview?.maxDonation || 0).toLocaleString('en-PK')}` },
                { label: 'Minimum Donation', value: `RS ${(insights?.overview?.minDonation || 0).toLocaleString('en-PK')}` }
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="font-semibold text-gray-900">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Hourly Distribution</h3>
            {insights?.distribution?.byHour && insights.distribution.byHour.length > 0 ? (
              <DonationChart 
                data={insights.distribution.byHour.map(item => ({
                  operatorName: `${item.hour || item._id || 0}:00`,
                  amount: item.amount || item.totalAmount || 0
                }))} 
                type="bar" 
                title=""
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No hourly data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Payment Method Distribution
            </h3>
            {insights?.distribution?.byPaymentMethod && insights.distribution.byPaymentMethod.length > 0 ? (
              <div className="h-80">
                <DonationChart 
                  data={insights.distribution.byPaymentMethod.map(item => ({
                    purpose: item.paymentMethod || item._id || 'Unknown',
                    amount: item.amount || item.totalAmount || 0
                  }))} 
                  type="pie" 
                  title=""
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No payment method data available
              </div>
            )}
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Purpose Distribution
            </h3>
            {insights?.distribution?.byPurpose && insights.distribution.byPurpose.length > 0 ? (
              <div className="h-80">
                <DonationChart 
                  data={insights.distribution.byPurpose.map(item => ({
                    operatorName: item.purpose || item._id || 'Unknown',
                    amount: item.amount || item.totalAmount || 0
                  }))} 
                  type="bar" 
                  title=""
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No purpose data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Trend Analysis */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Trend Analysis</h3>
            <div className="h-80 flex items-center justify-center text-gray-500">
              Trend analysis coming soon
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics