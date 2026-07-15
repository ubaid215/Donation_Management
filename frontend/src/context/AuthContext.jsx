/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useRef } from 'react'
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
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const initDone = useRef(false) // Prevent double initialization

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/reset-success']

  // Initialize auth on mount - ONLY ONCE
  useEffect(() => {
    // Skip if already initialized
    if (initDone.current) {
      // console.log('⏭️ Auth already initialized, skipping')
      return
    }

    const initAuth = async () => {
      const token = localStorage.getItem('token')
      
      console.log('🔐 Auth initialization started', { 
        hasToken: !!token, 
        path: location.pathname 
      })

      if (!token) {
        console.log('❌ No token found, skipping verification')
        setLoading(false)
        initDone.current = true
        return
      }

      try {
        // Set authorization header for all requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        console.log('🔄 Verifying token...')
        const response = await api.get('/auth/verify')
        
        // console.log('✅ Token verified successfully', response.user)
        
        if (response.user) {
          setUser(response.user)
          
          // If user is on login page, redirect to appropriate dashboard
          if (location.pathname === '/login') {
            if (response.user.role === 'ADMIN') {
              navigate('/dashboard', { replace: true })
            } else {
              navigate('/donations', { replace: true })
            }
          }
        } else {
          throw new Error('Invalid user data received')
        }
      } catch (error) {
        console.error('❌ Auth verification failed:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        })
        
        // Clear invalid token
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
        
        // Show error message only if we had a user before
        if (user) {
          toast.error('Session expired. Please login again.')
        }
        
        // Only redirect if not on public routes
        if (!publicRoutes.includes(location.pathname)) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
        initDone.current = true
      }
    }

    initAuth()
  }, []) // ✅ EMPTY DEPENDENCY ARRAY - runs only once

  // Add axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        // If error is 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          // Try to refresh token or logout
          const token = localStorage.getItem('token')
          if (token) {
            try {
              // Attempt to refresh token
              const response = await api.post('/auth/refresh-token', { token })
              if (response.token) {
                localStorage.setItem('token', response.token)
                api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`
                originalRequest.headers['Authorization'] = `Bearer ${response.token}`
                return api(originalRequest)
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError)
              // Logout on refresh failure
              logout()
            }
          }
        }
        
        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount
    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, []) // ✅ Empty dependency array

  const login = async (email, password) => {
    try {
      // console.log('🔑 Login attempt for:', email)
      
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response
      
      // console.log('✅ Login successful for:', user.name)
      
      // Store token
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      
      toast.success(`Welcome back, ${user.name}!`)
      
      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/donations', { replace: true })
      }
      
      return { success: true, user }
    } catch (error) {
      console.error('❌ Login error:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      })
      
      const message = error.response?.data?.error || error.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    console.log('🚪 Logging out user:', user?.name)
    
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/login', { replace: true })
    toast.success('Logged out successfully')
  }

  // 🔐 Password reset functions
  const requestPasswordReset = async (email) => {
    try {
      console.log('📧 Requesting password reset for:', email)
      
      const response = await api.post('/auth/forgot-password', { email })
      toast.success(response.message || 'Reset link sent to your email')
      return { success: true }
    } catch (error) {
      console.error('❌ Password reset request failed:', error)
      
      const message = error.response?.data?.error || error.message || 'Failed to send reset link'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const resetPassword = async (token, password, confirmPassword) => {
    try {
      console.log('🔐 Resetting password')
      
      const response = await api.post('/auth/reset-password', { 
        token, 
        password, 
        confirmPassword 
      })
      
      toast.success(response.message || 'Password reset successful')
      return { success: true }
    } catch (error) {
      console.error('❌ Password reset failed:', error)
      
      const message = error.response?.data?.error || error.message || 'Failed to reset password'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // 👤 Update user profile
  const updateProfile = async (profileData) => {
    try {
      console.log('👤 Updating profile for:', user?.name)
      
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
      console.error('❌ Profile update failed:', error)
      
      const message = error.response?.data?.message || error.message || 'Failed to update profile'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // 🔐 Change password
  const changePassword = async (passwordData) => {
    try {
      console.log('🔐 Changing password')
      
      const response = await api.post('/auth/change-password', passwordData)
      toast.success(response.message || 'Password changed successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Password change failed:', error)
      
      const message = error.response?.data?.message || error.message || 'Failed to change password'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // 📧 Change email
  const changeEmail = async (emailData) => {
    try {
      console.log('📧 Changing email')
      
      const response = await api.post('/auth/change-email', emailData)
      toast.success(response.message || 'Email changed successfully')
      
      // Update user email in context
      if (response.user) {
        setUser(prev => ({
          ...prev,
          email: response.user.email
        }))
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Email change failed:', error)
      
      const message = error.response?.data?.message || error.message || 'Failed to change email'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Role check functions
  const isAdmin = () => user?.role === 'ADMIN'
  const isOperator = () => user?.role === 'OPERATOR'

  const value = {
    user,
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

  // Don't render children until loading is complete
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}