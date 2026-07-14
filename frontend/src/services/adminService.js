import api from './api.js'

const adminService = {
  getSystemStats: async () => {
    try {
      console.log('Making request to /admin/stats/system')
      const response = await api.get('/admin/stats/system')
      console.log('getSystemStats response:', response)
      return response 
    } catch (error) {
      console.error('getSystemStats error:', error)
      throw error
    }
  },

  getDashboardMetrics: async () => {
    try {
      console.log('Making request to /admin/stats/dashboard')
      const response = await api.get('/admin/stats/dashboard')
      console.log('getDashboardMetrics response:', response)
      return response // Already the data object
    } catch (error) {
      console.error('getDashboardMetrics error:', error)
      throw error
    }
  },

  getDonationInsights: async (timeframe = 'month') => {
    try {
      console.log('Making request to /admin/analytics/insights with timeframe:', timeframe)
      const response = await api.get('/admin/analytics/insights', { 
        params: { timeframe } 
      })
      // console.log('getDonationInsights raw response:', response)
      if (!response) {
        console.error('No response received')
        throw new Error('Invalid response from server')
      }
      
      return response
    } catch (error) {
      console.error('getDonationInsights error:', error)
      console.error('Error response:', error.response)
      throw error
    }
  },

  getTimeSeriesData: async (startDate, endDate) => {
    try {
      console.log('Making request to /admin/analytics/time-series')
      const response = await api.get('/admin/analytics/time-series', {
        params: { startDate, endDate }
      })
      // console.log('getTimeSeriesData response:', response)
      return response 
    } catch (error) {
      console.error('getTimeSeriesData error:', error)
      throw error
    }
  },

  getCategoryBreakdown: async () => {
    try {
      console.log('Making request to /admin/analytics/categories')
      const response = await api.get('/admin/analytics/categories')
      // console.log('getCategoryBreakdown response:', response)
      return response 
    } catch (error) {
      console.error('getCategoryBreakdown error:', error)
      throw error
    }
  },

  getOperatorPerformance: async () => {
    try {
      console.log('Making request to /admin/analytics/operators')
      const response = await api.get('/admin/analytics/operators')
      // console.log('getOperatorPerformance response:', response)
      return response 
    } catch (error) {
      console.error('getOperatorPerformance error:', error)
      throw error
    }
  },

  exportData: async (exportType, filters = {}) => {
    try {
      console.log('Making request to /admin/export/' + exportType)
      const response = await api.get(`/admin/export/${exportType}`, {
        params: filters
      })
      console.log('exportData response:', response)
      return response 
    } catch (error) {
      console.error('exportData error:', error)
      throw error
    }
  },
}

export default adminService