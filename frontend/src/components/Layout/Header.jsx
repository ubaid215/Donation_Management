import React, { useState } from 'react'
import { Calendar, Search } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'

const Header = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-white border-b border-gray-200 h-16">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Left Section - Title & Date */}
        <div className="flex items-center gap-4 ml-12 lg:ml-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Donation Management'}
            </h2>
            <div className="hidden sm:flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1.5" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>
        
        {/* Right Section - Search, Notifications, User */}
        <div className="flex items-center gap-3">
          {/* Search - Hidden on small screens */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
          
          
          
          {/* User Avatar */}
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header