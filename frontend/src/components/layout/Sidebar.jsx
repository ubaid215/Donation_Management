import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  HandCoins, 
  BarChart3, 
  FileText, 
  Shield,
  Users,
  LogOut,
  Menu,
  X,
  PenLineIcon,
  Settings, 
  UserCircle 
} from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()

  const adminNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/donations', icon: HandCoins, label: 'Donations' },
    { path: '/categories', icon: PenLineIcon, label: 'Categories' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/audit-logs', icon: Shield, label: 'Audit Logs' },
    { path: '/operators', icon: Users, label: 'Operators' },
    { path: '/settings', icon: Settings, label: 'Settings' }, 
  ]

  const operatorNavItems = [
    { path: '/donations', icon: HandCoins, label: 'Donations' },
    { path: '/settings', icon: Settings, label: 'Settings' }, 
  ]

  const navItems = isAdmin() ? adminNavItems : operatorNavItems

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      onClick={() => setIsOpen(false)}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.label}
    </NavLink>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 px-6 border-b border-gray-200 flex items-center">
            <div className="flex items-center w-full">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <HandCoins className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">Donation System</h1>
                <p className="text-xs text-gray-500 truncate">
                  {isAdmin() ? 'Admin Panel' : 'Operator Panel'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>

          {/* User info & logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                {user?.role}
              </span>
              <NavLink
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </NavLink>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar