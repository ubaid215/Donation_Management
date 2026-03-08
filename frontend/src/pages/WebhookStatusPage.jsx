/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  MessageCircle,
  RefreshCw,
  Send,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Settings
} from 'lucide-react';
import { useWebhook } from '../context/WebhookContext';

const WebhookStatusPage = () => {
  const {
    stats,
    recentActivity,
    loading,
    error,
    lastUpdated,
    webhookInfo,
    autoRefresh,
    refreshInterval,
    fetchWebhookStatus,
    toggleAutoRefresh,
    changeRefreshInterval,
    clearError
  } = useWebhook();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'today',
    search: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);

  // Auto refresh effect
  useEffect(() => {
    fetchWebhookStatus();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchWebhookStatus, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchWebhookStatus]);

  // Get status badge color and icon
  const getStatusBadge = (status) => {
    const statuses = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      SENT: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send, label: 'Sent' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Delivered' },
      READ: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Eye, label: 'Read' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Failed' }
    };
    
    return statuses[status] || statuses.PENDING;
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  // Filter activities
  const filteredActivities = recentActivity.filter(activity => {
    if (filters.status !== 'all' && activity.whatsappStatus !== filters.status) return false;
    if (filters.search && !activity.donorName?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color, bgColor, trend }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold mt-2">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  // Activity Table Row
  const ActivityRow = ({ activity }) => {
    const status = getStatusBadge(activity.whatsappStatus);
    const StatusIcon = status.icon;
    const [expanded, setExpanded] = useState(false);

    return (
      <>
        <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${status.bg.replace('bg-', 'bg-')}`}></div>
              <span className="ml-3 text-sm font-medium text-gray-900">{activity.donorName}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-600">{activity.donorPhone}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-600">{formatTime(activity.whatsappStatusUpdatedAt)}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-900">Rs.{activity.amount}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </td>
        </tr>
        {expanded && (
          <tr className="bg-gray-50">
            <td colSpan="6" className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Message Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Message ID:</span>
                      <span className="text-sm font-mono">{activity.whatsappMessageId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Template:</span>
                      <span className="text-sm">{activity.templateUsed || 'Donation Confirmation'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Purpose:</span>
                      <span className="text-sm">{activity.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm">{activity.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Timeline</h4>
                  <div className="space-y-3">
                    {activity.whatsappSentAt && (
                      <div className="flex items-center">
                        <Send className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">Sent: {new Date(activity.whatsappSentAt).toLocaleString()}</span>
                      </div>
                    )}
                    {activity.whatsappStatus === 'DELIVERED' && (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">Delivered: {new Date(activity.whatsappStatusUpdatedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {activity.whatsappReadAt && (
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-sm text-gray-600">Read: {new Date(activity.whatsappReadAt).toLocaleString()}</span>
                      </div>
                    )}
                    {activity.whatsappError && (
                      <div className="flex items-center text-red-600">
                        <XCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">Failed: {activity.whatsappError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {activity.whatsappDeliveryDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Delivery Details</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(activity.whatsappDeliveryDetails, null, 2)}
                  </pre>
                </div>
              )}
            </td>
          </tr>
        )}
      </>
    );
  };

  if (loading && !recentActivity.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading webhook status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="w-8 h-8 text-green-600 mr-3" />
                WhatsApp Webhook Monitor
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time tracking of WhatsApp message delivery status
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={toggleAutoRefresh}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Zap className={`w-4 h-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-500'}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>

              {/* Refresh button */}
              <button
                onClick={fetchWebhookStatus}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Refresh Settings</h3>
            <div className="flex items-center space-x-4">
              <label className="text-sm text-gray-600">Refresh interval:</label>
              <select
                value={refreshInterval}
                onChange={(e) => changeRefreshInterval(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value={2000}>2 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
          />
          <StatCard
            title="Sent"
            value={stats.sent}
            icon={Send}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            title="Read"
            value={stats.read}
            icon={Eye}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircle}
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <StatCard
            title="Total"
            value={stats.total}
            icon={Activity}
            color="text-gray-600"
            bgColor="bg-gray-100"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div
            className="px-6 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            </div>
            {showFilters ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
          
          {showFilters && (
            <div className="px-6 pb-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="SENT">Sent</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="READ">Read</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Search Donor</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Recent WhatsApp Activity
              {filteredActivities.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {filteredActivities.length} messages
                </span>
              )}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No WhatsApp messages found</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Messages will appear here once you start sending WhatsApp notifications
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <ActivityRow key={activity.id || index} activity={activity} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          {filteredActivities.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                <Download className="w-4 h-4 mr-1" />
                Export Report
              </button>
            </div>
          )}
        </div>

        {/* Webhook Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Webhook Information</h4>
              <p className="text-xs text-blue-700 mb-2">
                Your webhook is active and receiving status updates from WhatsApp.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-blue-800">Webhook URL:</span>
                  <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                    /webhook/whatsapp
                  </code>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Status:</span>
                  <span className="ml-2 text-green-700 font-medium">✓ Verified</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Last Webhook:</span>
                  <span className="ml-2 text-blue-700">
                    {lastUpdated ? formatTime(lastUpdated) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Total Messages Tracked:</span>
                  <span className="ml-2 text-blue-700 font-medium">{stats.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookStatusPage;