import api from './api.js'

const authService = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password })
  },

  verify: async () => {
    return await api.get('/auth/verify')
  },

  getOperators: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return await api.get(`/auth/operators?${params}`)
  },

  createOperator: async (operatorData) => {
    return await api.post('/auth/operators', operatorData)
  },

  updateOperator: async (id, updateData) => {
    return await api.patch(`/auth/operators/${id}`, updateData)
  },

  getOperatorStats: async () => {
    return await api.get('/auth/operators/stats')
  }
}

export default authService