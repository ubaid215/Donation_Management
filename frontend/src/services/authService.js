import api from './api.js'

const authService = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password })
  },

  verify: async () => {
    return await api.get('/auth/verify')
  },

  // 🔐 Password reset methods
  requestPasswordReset: async (email) => {
    return await api.post('/auth/forgot-password', { email })
  },

  verifyResetToken: async (token) => {
    return await api.post('/auth/verify-reset-token', { token })
  },

  resetPassword: async (token, password, confirmPassword) => {
    return await api.post('/auth/reset-password', { 
      token, 
      password, 
      confirmPassword 
    })
  },

   // ✉️ Admin-only: Change email
  changeEmail: async (emailData) => {
    return await api.post('/auth/change-email', emailData)
  },

  // 👤 Profile management methods
  updateProfile: async (profileData) => {
    return await api.patch('/auth/profile', profileData)
  },

  changePassword: async (passwordData) => {
    return await api.post('/auth/change-password', passwordData)
  },

  // Existing methods
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