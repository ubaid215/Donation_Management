/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  PlusCircle, 
  Loader2, 
  Search, 
  User, 
  Phone, 
  DollarSign, 
  X, 
  Mail, 
  Send,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react'
import useDonations from '../../hooks/useDonations.js'
import useAuth from '../../hooks/useAuth.js' 
import toast from 'react-hot-toast'

// Popular country codes
const POPULAR_COUNTRIES = [
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
]

// Create dynamic validation schema
const createDonationSchema = (categories = []) => {
  return z.object({
    donorName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    donorPhone: z.string()
      .min(8, 'Phone number must be at least 8 characters (e.g., +923001234567)')
      .max(20, 'Phone number must be at most 20 characters')
      .regex(/^\+?[0-9]+$/, 'Phone number must start with + and contain only digits')
      .refine((val) => val.startsWith('+'), 'Phone number must start with + (e.g., +923001234567)'),
    donorEmail: z.string()
      .email('Invalid email address')
      .max(100, 'Email too long')
      .optional()
      .or(z.literal('')),
    amount: z.number().min(1, 'Amount must be at least RS 1'),
    purpose: z.string().min(1, 'Purpose is required').max(200),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
    notes: z.string().max(500).optional(),
    customPurpose: z.string().max(200).optional(),
    sendWhatsApp: z.boolean().optional().default(true)
  })
}

const DonationForm = ({ onSubmitSuccess }) => {
  const { 
    createDonation, 
    activeCategories,
    getDonorSuggestions,
    getDonorByPhone 
  } = useDonations()
  
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomPurpose, setShowCustomPurpose] = useState(false)
  const [submissionStage, setSubmissionStage] = useState('') // Track what's happening
  
  // Donor search state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState(null)
  
  const searchTimeoutRef = useRef(null)
  const wrapperRef = useRef(null)

  const donationSchema = createDonationSchema(activeCategories)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donorName: '',
      donorPhone: '',
      donorEmail: '',
      amount: '',
      purpose: '',
      customPurpose: '',
      paymentMethod: 'CASH',
      notes: '',
      sendWhatsApp: true
    }
  })

  const selectedPurpose = watch('purpose')
  const donorEmail = watch('donorEmail')
  const donorPhone = watch('donorPhone')
  const sendWhatsApp = watch('sendWhatsApp')
  const isAdmin = user.role === 'ADMIN'

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update custom purpose visibility
  useEffect(() => {
    if (selectedPurpose === 'CUSTOM') {
      setShowCustomPurpose(true)
      setValue('purpose', '')
    } else if (selectedPurpose && selectedPurpose !== 'CUSTOM') {
      setShowCustomPurpose(false)
      setValue('customPurpose', '')
    }
  }, [selectedPurpose, setValue])

  // Reset form completely
  const resetForm = () => {
    reset({
      donorName: '',
      donorPhone: '',
      donorEmail: '',
      amount: '',
      purpose: '',
      customPurpose: '',
      paymentMethod: 'CASH',
      notes: '',
      sendWhatsApp: true
    })
    
    setSearchQuery('')
    setSelectedDonor(null)
    setSuggestions([])
    setShowCustomPurpose(false)
    setSubmissionStage('')
  }

  // Fetch donor suggestions
  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setSearchLoading(true)
      const results = await getDonorSuggestions(query, 5)
      setSuggestions(results || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
  }

  // Extract country code
  const extractCountryCode = (fullPhone) => {
    if (!fullPhone) return null
    
    for (const country of POPULAR_COUNTRIES) {
      if (fullPhone.startsWith(country.code)) {
        return country
      }
    }
    return null
  }

  // Handle donor suggestion click
  const handleSuggestionClick = async (suggestion) => {
    try {
      setSearchLoading(true)
      
      const donor = await getDonorByPhone(suggestion.donorPhone)
      
      if (donor) {
        setValue('donorName', donor.donorName)
        setValue('donorPhone', donor.donorPhone)
        
        if (donor.donorEmail) {
          setValue('donorEmail', donor.donorEmail)
        } else {
          setValue('donorEmail', '')
        }
        
        if (donor.lastPurpose) {
          const categoryExists = activeCategories.some(cat => cat.name === donor.lastPurpose)
          if (categoryExists) {
            setValue('purpose', donor.lastPurpose)
          } else {
            setValue('purpose', 'CUSTOM')
            setValue('customPurpose', donor.lastPurpose)
            setShowCustomPurpose(true)
          }
        } else {
          setValue('purpose', '')
          setValue('customPurpose', '')
          setShowCustomPurpose(false)
        }
        
        if (donor.lastPaymentMethod) {
          setValue('paymentMethod', donor.lastPaymentMethod)
        } else {
          setValue('paymentMethod', 'CASH')
        }
        
        setValue('amount', '')
        setValue('notes', '')
        
        setSelectedDonor(donor)
        setSearchQuery(donor.donorName)
        setShowSuggestions(false)
        toast.success(`Donor loaded: ${donor.donorName}`)
      }
    } catch (error) {
      console.error('Error loading donor:', error)
      toast.error('Failed to load donor details')
    } finally {
      setSearchLoading(false)
    }
  }

  // Clear donor selection
  const handleClearDonor = () => {
    setSelectedDonor(null)
    setSearchQuery('')
    setValue('donorName', '')
    setValue('donorPhone', '')
    setValue('donorEmail', '')
    setValue('purpose', '')
    setValue('customPurpose', '')
    setValue('paymentMethod', 'CASH')
    setValue('amount', '')
    setValue('notes', '')
    setShowCustomPurpose(false)
  }

  // Quick fill country code
  const handleQuickFill = (code) => {
    const currentPhone = watch('donorPhone') || ''
    let cleanPhone = currentPhone.replace(/^\+\d+/, '')
    setValue('donorPhone', code + cleanPhone)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    try {
      // Stage 1: Preparing data
      setSubmissionStage('Preparing donation...')
      
      const donationData = {
        ...data,
        donorPhone: data.donorPhone,
        purpose: data.customPurpose || data.purpose,
        donorEmail: data.donorEmail && data.donorEmail.trim() !== '' ? data.donorEmail.trim() : undefined,
        sendWhatsApp: data.sendWhatsApp
      }
      
      delete donationData.customPurpose
      
      // Stage 2: Sending WhatsApp
      if (data.donorPhone) {
        const templateType = data.sendWhatsApp ? 'donation confirmation' : 'receipt confirmation'
        setSubmissionStage(`Sending WhatsApp ${templateType}...`)
      }
      
      // Stage 3: Call the API (WhatsApp happens first on backend)
      const result = await createDonation(donationData)
      
      if (result.success) {
        // Stage 4: Success
        setSubmissionStage('Donation recorded successfully!')
        
        // Reset form
        resetForm()
        
        // Build success message
        let successMessage = '✅ Donation recorded successfully!'
        
        if (data.donorEmail && data.donorEmail.trim() !== '') {
          successMessage += ' 📧 Email receipt will be sent automatically.'
        }
        
        if (data.donorPhone) {
          if (isAdmin) {
            if (data.sendWhatsApp) {
              successMessage += ' 📱 Donation confirmation WhatsApp sent.'
            } else {
              successMessage += ' 📱 Receipt confirmation WhatsApp sent.'
            }
          } else {
            successMessage += ' 📱 WhatsApp confirmation sent.'
          }
        }
        
        toast.success(successMessage, { duration: 5000 })
        
        if (onSubmitSuccess) {
          onSubmitSuccess()
        }
      } else {
        throw new Error(result.message || 'Failed to create donation')
      }
    } catch (error) {
      console.error('Donation submission error:', error)
      
      // Check if it's a WhatsApp-specific error
      if (error.code === 'WHATSAPP_FAILED' || error.message?.includes('WhatsApp')) {
        const details = error.details || {}
        
        if (details.canRetry) {
          // Network/connectivity issue
          toast.error(
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <WifiOff className="w-5 h-5" />
                Poor connectivity detected
              </div>
              <p className="text-sm">Unable to send WhatsApp notification. Please check your internet connection and try again.</p>
              <p className="text-xs text-gray-600">The donation was NOT saved to protect data integrity.</p>
            </div>,
            { duration: 7000 }
          )
        } else {
          // Permanent error (configuration issue)
          toast.error(
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-5 h-5" />
                WhatsApp Configuration Issue
              </div>
              <p className="text-sm">{details.message || error.message}</p>
              <p className="text-xs text-gray-600">Please contact your administrator to fix WhatsApp settings.</p>
            </div>,
            { duration: 8000 }
          )
        }
      } else {
        // General error
        toast.error(
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-5 h-5" />
              Failed to record donation
            </div>
            <p className="text-sm">{error.message || 'An unexpected error occurred'}</p>
          </div>,
          { duration: 6000 }
        )
      }
    } finally {
      setIsSubmitting(false)
      setSubmissionStage('')
    }
  }

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <PlusCircle className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-800">New Donation Entry</h2>
        {isAdmin && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Admin Mode
          </span>
        )}
      </div>
      
      {/* Submission Progress Indicator */}
      {isSubmitting && submissionStage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{submissionStage}</p>
              {submissionStage.includes('WhatsApp') && (
                <p className="text-xs text-blue-600 mt-1">
                  This may take a few seconds. Ensuring delivery before saving...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Donor Search */}
        <div ref={wrapperRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Existing Donor
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              placeholder="Search by name or phone..."
              className="input pl-10"
              disabled={isSubmitting}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.donorPhone}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{suggestion.donorName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{suggestion.donorPhone}</span>
                    </div>
                  </div>
                  {suggestion.lastDonationDate && (
                    <div className="text-xs text-gray-500">
                      Last: {new Date(suggestion.lastDonationDate).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected Donor Info */}
          {selectedDonor && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Donor History</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-600">Total Donations:</span>
                      <span className="ml-2 font-medium">{selectedDonor.totalDonations}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Total Amount:</span>
                      <span className="ml-2 font-medium">Rs {selectedDonor.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearDonor}
                  className="text-blue-600 hover:text-blue-800 ml-4"
                  title="Clear donor selection"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donor Name *
            </label>
            <input
              type="text"
              {...register('donorName')}
              className={`input ${errors.donorName ? 'input-error' : ''}`}
              placeholder="Enter donor's full name"
              disabled={isSubmitting}
            />
            {errors.donorName && (
              <p className="mt-1 text-sm text-danger-600">{errors.donorName.message}</p>
            )}
          </div>
          
          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number (Full International Format) *
            </label>
            <div className="space-y-2">
              <input
                type="tel"
                {...register('donorPhone')}
                className={`input ${errors.donorPhone ? 'input-error' : ''}`}
                placeholder="+923001234567"
                disabled={isSubmitting}
              />
              
              {/* Quick Country Code Buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Quick select:</span>
                {POPULAR_COUNTRIES.map(country => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleQuickFill(country.code)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors disabled:opacity-50"
                    title={country.country}
                    disabled={isSubmitting}
                  >
                    {country.flag} {country.code}
                  </button>
                ))}
              </div>
            </div>
            {errors.donorPhone && (
              <p className="mt-1 text-sm text-danger-600">{errors.donorPhone.message}</p>
            )}
            {!errors.donorPhone && watch('donorPhone') && (
              <div className="mt-1 text-xs text-gray-500">
                {extractCountryCode(watch('donorPhone')) && (
                  <span className="text-green-600">
                    ✓ {extractCountryCode(watch('donorPhone')).flag} {extractCountryCode(watch('donorPhone')).country}
                  </span>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              💡 WhatsApp notification will be sent BEFORE saving to ensure delivery
            </p>
          </div>

          {/* Email Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address (Optional)
                {watch('donorEmail') && watch('donorEmail').trim() !== '' && (
                  <span className="text-xs text-green-600 font-normal flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    Receipt will be emailed
                  </span>
                )}
              </div>
            </label>
            <input
              type="email"
              {...register('donorEmail')}
              className={`input ${errors.donorEmail ? 'input-error' : ''}`}
              placeholder="donor@example.com (optional)"
              disabled={isSubmitting}
            />
            {errors.donorEmail && (
              <p className="mt-1 text-sm text-danger-600">{errors.donorEmail.message}</p>
            )}
            {!errors.donorEmail && watch('donorEmail') && watch('donorEmail').trim() !== '' && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                ✓ Beautiful email receipt will be sent automatically
              </p>
            )}
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Amount (RS) *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                RS
              </div>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className={`input pl-10 ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-danger-600">{errors.amount.message}</p>
            )}
          </div>
          
          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Purpose *
            </label>
            <select
              {...register('purpose')}
              className={`input ${errors.purpose ? 'input-error' : ''}`}
              disabled={isSubmitting}
            >
              <option value="">Select Purpose</option>
              {activeCategories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
              <option value="CUSTOM">Other (Custom Purpose)</option>
            </select>
            {errors.purpose && !showCustomPurpose && (
              <p className="mt-1 text-sm text-danger-600">{errors.purpose.message}</p>
            )}
          </div>
          
          {/* Custom Purpose */}
          {showCustomPurpose && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Purpose *
              </label>
              <input
                type="text"
                {...register('customPurpose')}
                className={`input ${errors.customPurpose ? 'input-error' : ''}`}
                placeholder="Enter custom donation purpose"
                disabled={isSubmitting}
              />
              {errors.customPurpose && (
                <p className="mt-1 text-sm text-danger-600">{errors.customPurpose.message}</p>
              )}
            </div>
          )}
          
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              {...register('paymentMethod')}
              className={`input ${errors.paymentMethod ? 'input-error' : ''}`}
              disabled={isSubmitting}
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-danger-600">{errors.paymentMethod.message}</p>
            )}
          </div>
          
          {/* WhatsApp Template Toggle (Admin Only) */}
          {isAdmin && (
            <div className="md:col-span-2">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${sendWhatsApp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {sendWhatsApp ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <label htmlFor="whatsapp-toggle" className="block text-sm font-medium text-gray-900 cursor-pointer">
                      WhatsApp Template Type
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {sendWhatsApp 
                        ? '✅ ON = Send "Donation Confirmation" template'
                        : '📧 OFF = Send "Receipt Confirmation" template'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="whatsapp-toggle"
                    type="checkbox"
                    {...register('sendWhatsApp')}
                    className="sr-only peer"
                    disabled={isSubmitting}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
          
          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows="3"
              className="input resize-none"
              placeholder="Any additional information..."
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        {/* Submit Button Section */}
        <div className="pt-6 space-y-4">
          {/* Action buttons row */}
          <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
            {/* Reset Button */}
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline px-6 py-3 order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Clear Form
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary px-8 py-3 flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {submissionStage || 'Processing...'}
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Record Donation
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                How it works:
              </p>
              <ol className="mt-2 ml-6 text-xs text-blue-700 space-y-1 list-decimal">
                <li>WhatsApp notification is sent first (with retries for network issues)</li>
                <li>Only if WhatsApp succeeds, donation is saved to database</li>
                <li>Email receipt is sent automatically in background (if email provided)</li>
              </ol>
              <p className="mt-2 text-xs text-blue-600">
                ✨ This ensures no donations are recorded without successful notification delivery
              </p>
            </div>

            {watch('donorEmail')?.trim() ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email receipt will be sent to <strong>{watch('donorEmail')}</strong>
              </p>
            ) : null}

            {isAdmin && (
              <p className={`text-sm flex items-center gap-1 ${sendWhatsApp ? 'text-green-600' : 'text-blue-600'}`}>
                <Bell className="w-4 h-4" />
                {sendWhatsApp
                  ? `✅ Donation Confirmation template will be sent to ${watch('donorPhone') || 'donor'}`
                  : `📧 Receipt Confirmation template will be sent to ${watch('donorPhone') || 'donor'}`}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default DonationForm