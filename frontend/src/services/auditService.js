import api from './api.js'

const auditService = {
  getLogs: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/audit/logs?${params}`)
  },

  getLogStats: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/audit/logs/stats?${params}`)
  }
}

export default auditService