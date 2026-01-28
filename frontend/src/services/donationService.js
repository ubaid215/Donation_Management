// services/donationService.js
import api from './api.js'

const donationService = {
  // ===== DONATION OPERATIONS =====
  createDonation: async (donationData) => {
    return await api.post('/donations', donationData)
  },

  getMyDonations: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/donations/my?${params}`)
  },

  getDonations: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/donations?${params}`)
  },

  getDonation: async (id) => {
    return await api.get(`/donations/${id}`)
  },

  // ===== NEW: UPDATE DONATION OPERATIONS =====
  updateDonation: async (id, updateData) => {
    return await api.put(`/donations/${id}`, updateData)
  },

  getDonationHistory: async (id) => {
    return await api.get(`/donations/${id}/history`)
  },

  // ===== NEW: DELETE/RESTORE OPERATIONS =====
  deleteDonation: async (id, reason = '') => {
    return await api.delete(`/donations/${id}`, { data: { reason } })
  },

  restoreDonation: async (id, reason = '') => {
    return await api.post(`/donations/${id}/restore`, { reason })
  },

  getDeletedDonations: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/donations/deleted?${params}`)
  },

  // ===== EMAIL OPERATIONS =====
  sendReceiptEmail: async (donationId, customMessage = '') => {
    return await api.post(`/donations/${donationId}/send-receipt`, {
      customMessage
    })
  },

  resendReceiptEmail: async (donationId, customMessage = '') => {
    return await api.post(`/donations/${donationId}/resend-receipt`, {
      customMessage
    })
  },

  getEmailStatus: async (donationId) => {
    return await api.get(`/donations/${donationId}/email-status`)
  },

  // ===== ANALYTICS OPERATIONS =====
  getAnalytics: async (timeframe = 'month') => {
    return await api.get(`/donations/analytics/overview?timeframe=${timeframe}`)
  },

  getTopDonors: async (limit = 10) => {
    return await api.get(`/donations/analytics/top-donors?limit=${limit}`)
  },

  exportReport: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/reports/donations?${params}`, {
      responseType: 'blob'
    })
  },

  // ===== DONOR SEARCH OPERATIONS =====
  searchDonors: async (query, limit = 10) => {
    const params = new URLSearchParams({ q: query, limit }).toString()
    return await api.get(`/donations/donors/search?${params}`)
  },

  getDonorSuggestions: async (query, limit = 5) => {
    const params = new URLSearchParams({ q: query, limit }).toString()
    return await api.get(`/donations/donors/suggestions?${params}`)
  },

  getDonorByPhone: async (phone) => {
    return await api.get(`/donations/donors/phone/${phone}`)
  },

  // ===== CATEGORY OPERATIONS =====
  getCategories: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/donations/categories?${params}`)
  },

  getCategory: async (id) => {
    return await api.get(`/donations/categories/${id}`)
  },

  getActiveCategories: async () => {
    return await api.get('/donations/categories/active')
  },

  createCategory: async (categoryData) => {
    return await api.post('/donations/categories', categoryData)
  },

  updateCategory: async (id, categoryData) => {
    return await api.put(`/donations/categories/${id}`, categoryData)
  },

  deleteCategory: async (id) => {
    return await api.delete(`/donations/categories/${id}`)
  },

  toggleCategoryStatus: async (id) => {
    return await api.patch(`/donations/categories/${id}/toggle-status`)
  },

  getCategoryStats: async (id) => {
    return await api.get(`/donations/categories/${id}/stats`)
  }
}

export default donationService