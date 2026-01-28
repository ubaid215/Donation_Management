import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { DonationProvider } from './context/DonationContext.jsx'
import Layout from './components/Layout/Layout.jsx'
import ProtectedRoute from './components/Layout/ProtectedRoute.jsx'

// Pages
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Donations from './pages/Donations.jsx'
import Analytics from './pages/Analytics.jsx'
import Reports from './pages/Reports.jsx'
import AuditLogs from './pages/AuditLogs.jsx'
import Operators from './pages/Operators.jsx'
import NotFound from './pages/NotFound.jsx'
import Categories from './pages/Categories.jsx'

// NEW: Password reset pages
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ResetSuccess from './pages/ResetSuccess.jsx'
import Settings from './pages/Settings.jsx' // NEW: User settings page
import DeletedDonations from './pages/DeletedDonations.jsx'

function App() {
  return (
    <AuthProvider>
      <DonationProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-success" element={<ResetSuccess />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/trash" element={<DeletedDonations />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/operators" element={<Operators />} />
              <Route path="/settings" element={<Settings />} /> 
            </Route>
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DonationProvider>
    </AuthProvider>
  )
}

export default App