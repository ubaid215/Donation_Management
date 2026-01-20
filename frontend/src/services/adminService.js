import api from './api.js'

const adminService = {
  getSystemStats: async () => {
    const response = await api.get('/admin/stats/system')
    return response.data // This returns { success: true, stats: {...} }
  },

  getDashboardMetrics: async () => {
    const response = await api.get('/admin/stats/dashboard')
    return response.data // This returns { success: true, metrics: {...} }
  },

  getDonationInsights: async (timeframe = 'month') => {
    const response = await api.get('/admin/analytics/insights', { 
      params: { timeframe } 
    })
    return response.data // This returns { success: true, insights: {...} }
  },

  getTimeSeriesData: async (startDate, endDate) => {
    const response = await api.get('/admin/analytics/time-series', {
      params: { startDate, endDate }
    })
    return response.data // This returns { success: true, data: {...} }
  },

  getCategoryBreakdown: async () => {
    const response = await api.get('/admin/analytics/categories')
    return response.data // This returns { success: true, breakdown: {...} }
  },

  getOperatorPerformance: async () => {
    const response = await api.get('/admin/analytics/operators')
    return response.data // This returns { success: true, performance: {...} }
  },

  exportData: async (exportType, filters = {}) => {
    const response = await api.get(`/admin/export/${exportType}`, {
      params: filters
    })
    return response.data // This returns { success: true, data: {...} }
  },

  // Category Management
  getAllCategories: async (isActive) => {
    const response = await api.get('/admin/categories', {
      params: { isActive }
    })
    return response.data // This returns { success: true, categories: [...] }
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/admin/categories/${id}`)
    return response.data // This returns { success: true, category: {...} }
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/admin/categories', categoryData)
    return response.data // This returns { success: true, message: "...", category: {...} }
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/admin/categories/${id}`, categoryData)
    return response.data 
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`)
    return response.data 
  },

  toggleCategoryStatus: async (id) => {
    const response = await api.patch(`/admin/categories/${id}/toggle-status`)
    return response.data
  }
}

export default adminService