/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, Loader2, Search, User, Phone, DollarSign, X, Mail, Send } from 'lucide-react'
import useDonations from '../../hooks/useDonations.js'
import toast from 'react-hot-toast'

// Create dynamic validation schema with email
const createDonationSchema = (categories = []) => {
  return z.object({
    donorName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    donorPhone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number required'),
    donorEmail: z.string()
      .email('Invalid email address')
      .max(100, 'Email too long')
      .optional()
      .or(z.literal('')),
    amount: z.number().min(1, 'Amount must be at least RS 1'),
    purpose: z.string().min(1, 'Purpose is required').max(200),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
    notes: z.string().max(500).optional(),
    customPurpose: z.string().max(200).optional()
  })
}

const DonationForm = ({ onSubmitSuccess }) => {
  const { 
    createDonation, 
    activeCategories,
    getDonorSuggestions,
    getDonorByPhone 
  } = useDonations()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomPurpose, setShowCustomPurpose] = useState(false)
  
  // Donor search state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState(null)
  
  const searchTimeoutRef = useRef(null)
  const wrapperRef = useRef(null)

  // Create dynamic schema
  const donationSchema = createDonationSchema(activeCategories)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      paymentMethod: 'CASH',
      purpose: '',
      customPurpose: '',
      donorEmail: ''
    }
  })

  const selectedPurpose = watch('purpose')
  const donorEmail = watch('donorEmail')

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

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
  }

  // Handle donor suggestion click
  const handleSuggestionClick = async (suggestion) => {
    try {
      setSearchLoading(true)
      
      // Fetch full donor details
      const donor = await getDonorByPhone(suggestion.donorPhone)
      
      if (donor) {
        // Fill form with donor info
        setValue('donorName', donor.donorName)
        setValue('donorPhone', donor.donorPhone.replace(/^0/, '')) // Remove leading 0 for +92
        
        // NEW: Set email if available
        if (donor.donorEmail) {
          setValue('donorEmail', donor.donorEmail)
        }
        
        // Set last used purpose and payment method if available
        if (donor.lastPurpose) {
          // Check if it's in active categories
          const categoryExists = activeCategories.some(cat => cat.name === donor.lastPurpose)
          if (categoryExists) {
            setValue('purpose', donor.lastPurpose)
          } else {
            setValue('purpose', 'CUSTOM')
            setValue('customPurpose', donor.lastPurpose)
          }
        }
        
        if (donor.lastPaymentMethod) {
          setValue('paymentMethod', donor.lastPaymentMethod)
        }
        
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
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    // Prepare the final data
    const donationData = {
      ...data,
      donorPhone: data.donorPhone.startsWith('0') ? data.donorPhone : '0' + data.donorPhone,
      purpose: data.customPurpose || data.purpose,
      // Only include email if it's provided and valid
      donorEmail: data.donorEmail && data.donorEmail.trim() !== '' ? data.donorEmail.trim() : undefined
    }
    
    delete donationData.customPurpose
    
    const result = await createDonation(donationData)
    setIsSubmitting(false)
    
    if (result.success) {
      // Keep donor info for quick re-entry
      const currentDonorName = data.donorName
      const currentDonorPhone = data.donorPhone
      const currentDonorEmail = data.donorEmail
      const currentPurpose = data.customPurpose || data.purpose
      const currentPaymentMethod = data.paymentMethod
      
      reset({
        donorName: currentDonorName,
        donorPhone: currentDonorPhone,
        donorEmail: currentDonorEmail,
        purpose: data.purpose,
        customPurpose: data.customPurpose,
        paymentMethod: currentPaymentMethod,
        amount: '',
        notes: ''
      })
      
      // Show appropriate success message based on email
      if (data.donorEmail && data.donorEmail.trim() !== '') {
        toast.success('✅ Donation recorded! Email receipt will be sent automatically.')
      } else {
        toast.success('✅ Donation recorded! WhatsApp notification sent.')
      }
      
      toast.success('💡 Donor info kept for quick re-entry', { duration: 3000 })
      
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
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
      </div>
      
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
            />
            {errors.donorName && (
              <p className="mt-1 text-sm text-danger-600">{errors.donorName.message}</p>
            )}
          </div>
          
          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                +92
              </div>
              <input
                type="tel"
                {...register('donorPhone')}
                className={`input pl-14 ${errors.donorPhone ? 'input-error' : ''}`}
                placeholder="300*******"
                maxLength="10"
              />
            </div>
            {errors.donorPhone && (
              <p className="mt-1 text-sm text-danger-600">{errors.donorPhone.message}</p>
            )}
          </div>

          {/* NEW: Email Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address (Optional)
                {donorEmail && donorEmail.trim() !== '' && (
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
            />
            {errors.donorEmail && (
              <p className="mt-1 text-sm text-danger-600">{errors.donorEmail.message}</p>
            )}
            {!errors.donorEmail && donorEmail && donorEmail.trim() !== '' && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                ✓ Beautiful email receipt will be sent automatically
              </p>
            )}
            {!donorEmail || donorEmail.trim() === '' && (
              <p className="mt-1 text-sm text-gray-500">
                💬 WhatsApp notification will be sent instead
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
            >
              <option value="">Select Method</option>
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-danger-600">{errors.paymentMethod.message}</p>
            )}
          </div>
          
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
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-8 py-3 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                Record Donation
              </>
            )}
          </button>
          
          {/* Dynamic notification info */}
          <div className="mt-3 space-y-1">
            {donorEmail && donorEmail.trim() !== '' ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email receipt will be sent to: <strong>{donorEmail}</strong>
              </p>
            ) : (
              <p className="text-sm text-blue-600">
                💬 WhatsApp confirmation will be sent to donor
              </p>
            )}
            <p className="text-sm text-gray-500">
              💡 Tip: Search for existing donors to auto-fill their info. After saving, donor details are kept for quick re-entry.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}

export default DonationForm