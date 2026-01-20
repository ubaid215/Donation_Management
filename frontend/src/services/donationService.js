import api from './api.js'

const donationService = {
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
  }
}

export default donationService