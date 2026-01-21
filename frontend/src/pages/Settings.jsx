import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Save,
  AlertCircle,
  Loader2,
  Key
} from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import api from '../services/api.js'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, setUser, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  // Email change state (admin only)
  const [emailChangeForm, setEmailChangeForm] = useState({
    newEmail: '',
    confirmNewEmail: '',
    currentPassword: ''
  })
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState({
    profile: false,
    password: false
  })

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  // Check password requirements
  const checkPasswordRequirements = (password) => {
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
  }

  const handleEmailChangeForm = (e) => {
    const { name, value } = e.target
    setEmailChangeForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
    
    if (name === 'newPassword') {
      checkPasswordRequirements(value)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    // Check if anything changed
    const changes = {}
    if (profileForm.name !== user?.name) changes.name = profileForm.name
    if (profileForm.phone !== user?.phone) changes.phone = profileForm.phone
    
    if (Object.keys(changes).length === 0) {
      toast.error('No changes made to profile')
      return
    }

    setLoading(prev => ({ ...prev, profile: true }))
    
    try {
      const response = await api.patch('/auth/profile', changes)
      
      if (response.success) {
        // Update user context with new data
        setUser(prev => ({
          ...prev,
          ...response.user
        }))
        
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
      
      // Reset form to original values on error
      setProfileForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      })
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handleEmailChangeSubmit = async (e) => {
    e.preventDefault()
    
    const { newEmail, confirmNewEmail, currentPassword } = emailChangeForm

    // Validation
    if (!newEmail || !confirmNewEmail || !currentPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newEmail !== confirmNewEmail) {
      toast.error('Email addresses do not match')
      return
    }

    if (newEmail === user?.email) {
      toast.error('New email must be different from current email')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setChangingEmail(true)
    
    try {
      const response = await api.post('/auth/change-email', {
        newEmail,
        currentPassword
      })
      
      if (response.success) {
        toast.success('Email address changed successfully. Please login again.')
        
        // Reset form
        setEmailChangeForm({
          newEmail: '',
          confirmNewEmail: '',
          currentPassword: ''
        })
        
        // Update email in profile form
        setProfileForm(prev => ({
          ...prev,
          email: newEmail
        }))
        
        // Logout user after email change for security
        setTimeout(() => {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }, 2000)
      }
    } catch (error) {
      console.error('Email change error:', error)
      toast.error(error.response?.data?.message || 'Failed to change email address')
    } finally {
      setChangingEmail(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    // Check all requirements
    const allMet = Object.values(passwordRequirements).every(req => req)
    if (!allMet) {
      toast.error('Password does not meet all requirements')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setLoading(prev => ({ ...prev, password: true }))
    
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      })
      
      if (response.success) {
        toast.success('Password changed successfully')
        
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Reset password requirements
        setPasswordRequirements({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false
        })
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Basic Profile Information */}
              <div className="card p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Update your personal information
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        className="input"
                        placeholder="Enter your name"
                        disabled={loading.profile}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          className={`input pl-9 ${isAdmin() ? '' : 'bg-gray-50'}`}
                          placeholder="you@example.com"
                          disabled={!isAdmin() || loading.profile}
                          readOnly={!isAdmin()}
                        />
                        {!isAdmin() && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Cannot change
                            </span>
                          </div>
                        )}
                      </div>
                      {!isAdmin() && (
                        <p className="text-xs text-gray-500 mt-1">
                          Email address cannot be changed for operators
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="input"
                      placeholder="+1 (555) 123-4567"
                      disabled={loading.profile}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading.profile}
                      className="btn btn-primary flex items-center disabled:opacity-50"
                    >
                      {loading.profile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    {profileForm.name !== user?.name || profileForm.phone !== user?.phone ? (
                      <p className="text-sm text-gray-500 mt-2">
                        You have unsaved changes
                      </p>
                    ) : null}
                  </div>
                </form>
              </div>

              {/* Admin-only: Change Email Section */}
              {isAdmin() && (
                <div className="card p-6 border border-blue-200 bg-blue-50">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-blue-900 flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      Change Email Address (Admin Only)
                    </h2>
                    <p className="text-blue-700 text-sm mt-1">
                      As an administrator, you can change your email address. 
                      You will be logged out after changing your email for security reasons.
                    </p>
                  </div>

                  <form onSubmit={handleEmailChangeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          New Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                          <input
                            type="email"
                            name="newEmail"
                            value={emailChangeForm.newEmail}
                            onChange={handleEmailChangeForm}
                            className="input pl-9 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="new@example.com"
                            disabled={changingEmail}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Confirm New Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                          <input
                            type="email"
                            name="confirmNewEmail"
                            value={emailChangeForm.confirmNewEmail}
                            onChange={handleEmailChangeForm}
                            className="input pl-9 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Confirm new email"
                            disabled={changingEmail}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                        <input
                          type={showEmailPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={emailChangeForm.currentPassword}
                          onChange={handleEmailChangeForm}
                          className="input pl-9 pr-9 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter current password to confirm"
                          disabled={changingEmail}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 disabled:opacity-50"
                          disabled={changingEmail}
                        >
                          {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Email Match Indicator */}
                    {emailChangeForm.newEmail && emailChangeForm.confirmNewEmail && (
                      <div className={`p-3 rounded-lg ${emailChangeForm.newEmail === emailChangeForm.confirmNewEmail ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center">
                          {emailChangeForm.newEmail === emailChangeForm.confirmNewEmail ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-700 text-sm">Email addresses match</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              <span className="text-red-700 text-sm">Email addresses do not match</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-blue-200">
                      <button
                        type="submit"
                        disabled={changingEmail}
                        className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center disabled:opacity-50"
                      >
                        {changingEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Changing Email...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Change Email Address
                          </>
                        )}
                      </button>
                      <p className="text-xs text-blue-700 mt-2">
                        ⚠️ You will be logged out after changing your email address.
                      </p>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Update your password to keep your account secure
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="input pl-9 pr-9"
                      placeholder="Enter current password"
                      disabled={loading.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={loading.password}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="input pl-9 pr-9"
                      placeholder="Enter new password"
                      disabled={loading.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={loading.password}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Password must contain:</p>
                    <div className="space-y-1">
                      {Object.entries({
                        length: 'At least 8 characters',
                        uppercase: 'One uppercase letter',
                        lowercase: 'One lowercase letter',
                        number: 'One number',
                        special: 'One special character'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center text-sm">
                          {passwordRequirements[key] ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-300 mr-2" />
                          )}
                          <span className={passwordRequirements[key] ? 'text-green-600' : 'text-gray-500'}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input pl-9 pr-9"
                      placeholder="Confirm new password"
                      disabled={loading.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={loading.password}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Match Indicator */}
                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <div className={`p-3 rounded-lg ${passwordForm.newPassword === passwordForm.confirmPassword ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center">
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-green-700 text-sm">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span className="text-red-700 text-sm">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading.password}
                    className="btn btn-success flex items-center disabled:opacity-50"
                  >
                    {loading.password ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your account security and session settings
                </p>
              </div>

              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-3">Disabled</span>
                      <button className="btn btn-outline text-sm py-1 px-3">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Management */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Active Sessions</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage your logged-in devices
                      </p>
                    </div>
                    <button className="btn btn-outline text-sm py-1 px-3">
                      View Sessions
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Current session: This device • Just now
                    </div>
                  </div>
                </div>

                {/* Account Activity */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Recent Activity</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Review your account activity
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <Lock className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900">Password changed</p>
                        <p className="text-gray-500 text-xs">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900">Profile updated</p>
                        <p className="text-gray-500 text-xs">1 week ago</p>
                      </div>
                    </div>
                    {isAdmin() && (
                      <div className="flex items-center text-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900">Email address changed</p>
                          <p className="text-gray-500 text-xs">1 month ago</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Security Tips</h4>
                      <ul className="mt-2 text-sm text-blue-800 space-y-1">
                        <li>• Use a strong, unique password</li>
                        <li>• Never share your password with anyone</li>
                        <li>• Enable two-factor authentication for extra security</li>
                        <li>• Log out from shared devices</li>
                        {isAdmin() && (
                          <li>• Change your email address only when necessary</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings