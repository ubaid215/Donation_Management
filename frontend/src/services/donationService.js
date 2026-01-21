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
  
  // Search donors by name or phone with full details
  searchDonors: async (query, limit = 10) => {
    const params = new URLSearchParams({ q: query, limit }).toString()
    return await api.get(`/donations/donors/search?${params}`)
  },

  // Get autocomplete suggestions for donors
  getDonorSuggestions: async (query, limit = 5) => {
    const params = new URLSearchParams({ q: query, limit }).toString()
    return await api.get(`/donations/donors/suggestions?${params}`)
  },

  // Get donor details by phone number
  getDonorByPhone: async (phone) => {
    return await api.get(`/donations/donors/phone/${phone}`)
  },

  // ===== CATEGORY OPERATIONS =====
  
  // Get all categories (with optional filters)
  getCategories: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/donations/categories?${params}`)
  },

  // Get single category by ID
  getCategory: async (id) => {
    return await api.get(`/donations/categories/${id}`)
  },

  // Get active categories only (useful for dropdowns)
  getActiveCategories: async () => {
    return await api.get('/donations/categories/active')
  },

  // Create new category (admin only)
  createCategory: async (categoryData) => {
    return await api.post('/donations/categories', categoryData)
  },

  // Update category (admin only)
  updateCategory: async (id, categoryData) => {
    return await api.put(`/donations/categories/${id}`, categoryData)
  },

  // Delete category (admin only)
  deleteCategory: async (id) => {
    return await api.delete(`/donations/categories/${id}`)
  },

  // Toggle category active status (admin only)
  toggleCategoryStatus: async (id) => {
    return await api.patch(`/donations/categories/${id}/toggle-status`)
  },

  // Get category statistics
  getCategoryStats: async (id) => {
    return await api.get(`/donations/categories/${id}/stats`)
  }
}

export default donationService