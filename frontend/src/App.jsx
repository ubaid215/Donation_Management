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

function App() {
  return (
    <AuthProvider>
      <DonationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/donations" element={<Donations />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/operators" element={<Operators />} />
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