/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify')
      setUser(response.user) // Fixed: response is already the data
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      // Fixed: response is already the data object from the interceptor
      const { token, user } = response
      
      console.log('Login response:', response) // Debug log
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      
      toast.success(`Welcome back, ${user.name}!`)
      
      // Navigate based on role
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

  const isAdmin = () => user?.role === 'ADMIN'
  const isOperator = () => user?.role === 'OPERATOR'

  const value = {
    user,
    token,
    loading,
    login,
    logout,
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