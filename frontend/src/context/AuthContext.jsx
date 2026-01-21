/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api.js'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Reset loading when navigating away from auth pages
  useEffect(() => {
    if (loading && !location.pathname.includes('/login') && 
        !location.pathname.includes('/reset-password') &&
        !location.pathname.includes('/forgot-password')) {
      setLoading(false)
    }
  }, [location.pathname, loading])

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify')
      setUser(response.user)
    } catch (error) {
      // Only show logout toast if user was previously logged in
      if (user) {
        toast.error('Session expired. Please login again.')
      }
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      
      toast.success(`Welcome back, ${user.name}!`)
      
      if (user.role === 'ADMIN') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/donations', { replace: true })
      }
      
      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.error || error.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  // 🔐 Password reset functions
  const requestPasswordReset = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      toast.success(response.message || 'Reset link sent to your email')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to send reset link'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const resetPassword = async (token, password, confirmPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        password, 
        confirmPassword 
      })
      toast.success(response.message || 'Password reset successful')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to reset password'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // 👤 Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.patch('/auth/profile', profileData)
      if (response.success) {
        // Update user in context
        setUser(prev => ({
          ...prev,
          ...response.user
        }))
        toast.success('Profile updated successfully')
      }
      return { success: true, user: response.user }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // 🔐 Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData)
      toast.success(response.message || 'Password changed successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to change password'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Add this function to AuthContext
const changeEmail = async (emailData) => {
  try {
    const response = await api.post('/auth/change-email', emailData)
    toast.success(response.message || 'Email changed successfully')
    return { success: true }
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to change email'
    toast.error(message)
    return { success: false, error: message }
  }
}

  const isAdmin = () => user?.role === 'ADMIN'
  const isOperator = () => user?.role === 'OPERATOR'

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    changeEmail,
    isAdmin,
    isOperator,
    setUser
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}