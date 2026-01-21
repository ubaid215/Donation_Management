/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, Loader2 } from 'lucide-react'
import useDonations from '../../hooks/useDonations.js'

// Remove the hardcoded donationSchema and create a dynamic one
const createDonationSchema = (categories = []) => {
  // Extract category names for validation
  const categoryNames = categories.map(cat => cat.name)
  
  return z.object({
    donorName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    donorPhone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number required'),
    amount: z.number().min(1, 'Amount must be at least RS 1'),
    purpose: z.string().min(1, 'Purpose is required').max(200),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
    notes: z.string().max(500).optional(),
    customPurpose: z.string().max(200).optional() // For custom purposes
  })
}

const DonationForm = ({ onSubmitSuccess }) => {
  const { createDonation, activeCategories } = useDonations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomPurpose, setShowCustomPurpose] = useState(false)

  // Create dynamic schema based on active categories
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
      customPurpose: ''
    }
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedPurpose = watch('purpose')

  // Update showCustomPurpose when purpose changes
  React.useEffect(() => {
    if (selectedPurpose === 'CUSTOM') {
      setShowCustomPurpose(true)
      // Clear any previously selected purpose value
      setValue('purpose', '')
    } else if (selectedPurpose && selectedPurpose !== 'CUSTOM') {
      setShowCustomPurpose(false)
      // Clear custom purpose if a predefined one is selected
      setValue('customPurpose', '')
    }
  }, [selectedPurpose, setValue])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    // Prepare the final data
    const donationData = {
      ...data,
      // If custom purpose is used, use it instead of purpose
      purpose: data.customPurpose || data.purpose
    }
    
    // Remove customPurpose from the final data as it's not needed in the backend
    delete donationData.customPurpose
    
    const result = await createDonation(donationData)
    setIsSubmitting(false)
    
    if (result.success) {
      reset()
      setShowCustomPurpose(false)
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    }
  }

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' }
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <PlusCircle className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-800">New Donation Entry</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          
          {/* Purpose - Dynamic from context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Purpose *
            </label>
            <select
              {...register('purpose')}
              className={`input ${errors.purpose ? 'input-error' : ''}`}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setShowCustomPurpose(true)
                } else {
                  setShowCustomPurpose(false)
                }
              }}
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
          
          {/* Custom Purpose Input - Shown when "Other" is selected */}
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
          <p className="mt-3 text-sm text-gray-500">
            * WhatsApp confirmation will be sent to donor automatically
          </p>
        </div>
      </form>
    </div>
  )
}

export default DonationForm