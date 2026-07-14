import React from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-warning-100 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-warning-600" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>If you believe this is an error, please contact the system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound