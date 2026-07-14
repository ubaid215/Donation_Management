import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'

const ProtectedRoute = ({ adminOnly = false, operatorOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/donations" replace />
  }

  if (operatorOnly && user.role !== 'OPERATOR') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute