import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Header - Fixed at top */}
        <Header />
        
        {/* Main Content */}
        <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout