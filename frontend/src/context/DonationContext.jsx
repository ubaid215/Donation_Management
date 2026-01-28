/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import donationService from '../services/donationService.js'

const DonationContext = createContext(null)

export const useDonations = () => {
  const context = useContext(DonationContext)
  if (!context) {
    throw new Error('useDonations must be used within DonationProvider')
  }
  return context
}

export const DonationProvider = ({ children }) => {
  // ===== DONATION STATE =====
  const [donations, setDonations] = useState([])
  const [deletedDonations, setDeletedDonations] = useState([]) // NEW: Deleted donations state
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false) // NEW: Update loading state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  })
  const [deletedPagination, setDeletedPagination] = useState({ // NEW: Deleted pagination
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  })
  const [filters, setFilters] = useState({})

  // ===== CATEGORY STATE =====
  const [categories, setCategories] = useState([])
  const [activeCategories, setActiveCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryPagination, setCategoryPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  })

  // ===== DONOR SEARCH STATE =====
  const [donorSearchResults, setDonorSearchResults] = useState([])
  const [donorSearchLoading, setDonorSearchLoading] = useState(false)

  // ===== EMAIL STATE =====
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState({})

  // ===== DONATION HISTORY STATE =====
  const [donationHistory, setDonationHistory] = useState({})

  // ===== DONATION OPERATIONS =====
  const fetchDonations = async (newFilters = {}) => {
    try {
      setLoading(true)
      const combinedFilters = { ...filters, ...newFilters }
      setFilters(combinedFilters)
      
      const result = await donationService.getDonations(combinedFilters)
      setDonations(result.donations)
      setPagination(result.pagination)
    } catch (error) {
      toast.error('Failed to fetch donations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyDonations = async (newFilters = {}) => {
    try {
      setLoading(true)
      const result = await donationService.getMyDonations(newFilters)
      setDonations(result.donations)
      setPagination(result.pagination)
    } catch (error) {
      toast.error('Failed to fetch your donations')
    } finally {
      setLoading(false)
    }
  }

  // NEW: Fetch deleted donations (admin only)
  const fetchDeletedDonations = async (filters = {}) => {
    try {
      setLoading(true)
      const result = await donationService.getDeletedDonations(filters)
      setDeletedDonations(result.donations)
      setDeletedPagination(result.pagination)
      return { success: true, data: result }
    } catch (error) {
      toast.error('Failed to fetch deleted donations')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // NEW: Update donation
  const updateDonation = async (id, updateData) => {
    try {
      setUpdating(true)
      const result = await donationService.updateDonation(id, updateData)
      
      if (result.success) {
        // Update donation in the donations list
        setDonations(prev =>
          prev.map(donation =>
            donation.id === id ? result.donation : donation
          )
        )
        
        // Update in deleted donations list if it's there
        setDeletedDonations(prev =>
          prev.map(donation =>
            donation.id === id ? result.donation : donation
          )
        )
        
        toast.success('Donation updated successfully')
        return { success: true, donation: result.donation }
      }
      
      return { success: false, error: 'Failed to update donation' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update donation'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setUpdating(false)
    }
  }

  // NEW: Get donation history
  const getDonationHistory = async (id) => {
    try {
      const result = await donationService.getDonationHistory(id)
      
      if (result.success) {
        setDonationHistory(prev => ({
          ...prev,
          [id]: result.history
        }))
        return { success: true, history: result.history }
      }
      
      return { success: false, error: 'Failed to get donation history' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get donation history'
      console.error(message)
      return { success: false, error: message }
    }
  }

  // NEW: Soft delete donation
  const deleteDonation = async (id, reason = '') => {
    try {
      setUpdating(true)
      const result = await donationService.deleteDonation(id, reason)
      
      if (result.success) {
        // Remove from active donations list
        setDonations(prev => prev.filter(donation => donation.id !== id))
        
        // Add to deleted donations list
        setDeletedDonations(prev => [result.donation, ...prev])
        
        toast.success('Donation deleted successfully')
        return { success: true, donation: result.donation }
      }
      
      return { success: false, error: 'Failed to delete donation' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete donation'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setUpdating(false)
    }
  }

  // NEW: Restore deleted donation
  const restoreDonation = async (id, reason = '') => {
    try {
      setUpdating(true)
      const result = await donationService.restoreDonation(id, reason)
      
      if (result.success) {
        // Remove from deleted donations list
        setDeletedDonations(prev => prev.filter(donation => donation.id !== id))
        
        // Add back to active donations list
        setDonations(prev => [result.donation, ...prev])
        
        toast.success('Donation restored successfully')
        return { success: true, donation: result.donation }
      }
      
      return { success: false, error: 'Failed to restore donation' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to restore donation'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setUpdating(false)
    }
  }

  const createDonation = async (donationData) => {
    try {
      setLoading(true)
      const result = await donationService.createDonation(donationData)
      
      if (result.success) {
        setDonations(prev => [result.donation, ...prev])
        toast.success('Donation recorded successfully')
        
        // Send notifications
        if (donationData.donorPhone) {
          toast.success('WhatsApp confirmation sent to donor')
        }
        
        // Send email receipt if requested and email is provided
        if (donationData.sendEmail && donationData.donorEmail) {
          toast.promise(
            sendReceiptEmail(result.donation.id),
            {
              loading: 'Sending email receipt...',
              success: 'Email receipt sent successfully!',
              error: 'Failed to send email receipt'
            }
          )
        }
        
        return { success: true, donation: result.donation }
      }
      
      return { success: false, error: 'Failed to create donation' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to record donation'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({})
    fetchDonations({})
  }

  // ===== EMAIL OPERATIONS =====
  const sendReceiptEmail = async (donationId, customMessage = '') => {
    try {
      setEmailSending(true)
      const result = await donationService.sendReceiptEmail(donationId, customMessage)
      
      if (result.success) {
        // Update donation in list to reflect email status
        setDonations(prev =>
          prev.map(donation =>
            donation.id === donationId
              ? {
                  ...donation,
                  emailSent: true,
                  emailSentAt: new Date().toISOString()
                }
              : donation
          )
        )
        
        toast.success('Receipt email sent successfully')
        return { success: true, data: result }
      }
      
      return { success: false, error: 'Failed to send email' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send email'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setEmailSending(false)
    }
  }

  const resendReceiptEmail = async (donationId, customMessage = '') => {
    try {
      setEmailSending(true)
      const result = await donationService.resendReceiptEmail(donationId, customMessage)
      
      if (result.success) {
        toast.success('Receipt email re-sent successfully')
        return { success: true, data: result }
      }
      
      return { success: false, error: 'Failed to resend email' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to resend email'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setEmailSending(false)
    }
  }

  const getEmailStatus = async (donationId) => {
    try {
      const result = await donationService.getEmailStatus(donationId)
      
      if (result.success) {
        setEmailStatus(prev => ({
          ...prev,
          [donationId]: result.emailStatus
        }))
        return { success: true, status: result.emailStatus }
      }
      
      return { success: false, error: 'Failed to get email status' }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get email status'
      console.error(message)
      return { success: false, error: message }
    }
  }

  // ===== DONOR SEARCH OPERATIONS =====
  const searchDonors = async (query, limit = 10) => {
    if (!query || query.trim().length < 2) {
      setDonorSearchResults([])
      return []
    }

    try {
      setDonorSearchLoading(true)
      const result = await donationService.searchDonors(query, limit)
      
      if (result.success) {
        setDonorSearchResults(result.donors || [])
        return result.donors || []
      }
      
      return []
    } catch (error) {
      console.error('Failed to search donors:', error)
      return []
    } finally {
      setDonorSearchLoading(false)
    }
  }

  const getDonorSuggestions = async (query, limit = 5) => {
    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      const result = await donationService.getDonorSuggestions(query, limit)
      return result.success ? (result.suggestions || []) : []
    } catch (error) {
      console.error('Failed to get donor suggestions:', error)
      return []
    }
  }

  const getDonorByPhone = async (phone) => {
    if (!phone || phone.trim().length === 0) {
      return null
    }

    try {
      const result = await donationService.getDonorByPhone(phone)
      return result.success ? result.donor : null
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to get donor by phone:', error)
      }
      return null
    }
  }

  const clearDonorSearch = () => {
    setDonorSearchResults([])
  }

  // ===== CATEGORY OPERATIONS =====
  const fetchCategories = async (categoryFilters = {}) => {
    try {
      setCategoriesLoading(true)
      const result = await donationService.getCategories(categoryFilters)
      setCategories(result.categories)
      setCategoryPagination(result.pagination)
    } catch (error) {
      toast.error('Failed to fetch categories')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchActiveCategories = async () => {
    try {
      const result = await donationService.getActiveCategories()
      if (result.success) {
        setActiveCategories(result.categories || [])
      } else if (result.data && result.data.success) {
        setActiveCategories(result.data.categories || [])
      } else {
        setActiveCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch active categories:', error)
      setActiveCategories([])
    }
  }

  const createCategory = async (categoryData) => {
    try {
      setCategoriesLoading(true)
      const result = await donationService.createCategory(categoryData)
      
      setCategories(prev => [result.category, ...prev])
      
      if (result.category.isActive) {
        setActiveCategories(prev => [...prev, result.category])
      }
      
      toast.success('Category created successfully')
      return { success: true, category: result.category }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create category'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setCategoriesLoading(false)
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      setCategoriesLoading(true)
      const result = await donationService.updateCategory(id, categoryData)
      
      setCategories(prev =>
        prev.map(cat => (cat.id === id ? result.category : cat))
      )
      
      if (result.category.isActive) {
        setActiveCategories(prev => {
          const exists = prev.find(cat => cat.id === id)
          if (exists) {
            return prev.map(cat => (cat.id === id ? result.category : cat))
          } else {
            return [...prev, result.category]
          }
        })
      } else {
        setActiveCategories(prev => prev.filter(cat => cat.id !== id))
      }
      
      toast.success('Category updated successfully')
      return { success: true, category: result.category }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update category'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setCategoriesLoading(false)
    }
  }

  const deleteCategory = async (id) => {
    try {
      setCategoriesLoading(true)
      await donationService.deleteCategory(id)
      
      setCategories(prev => prev.filter(cat => cat.id !== id))
      setActiveCategories(prev => prev.filter(cat => cat.id !== id))
      
      toast.success('Category deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete category'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setCategoriesLoading(false)
    }
  }

  const toggleCategoryStatus = async (id) => {
    try {
      const result = await donationService.toggleCategoryStatus(id)
      
      setCategories(prev =>
        prev.map(cat => (cat.id === id ? result.category : cat))
      )
      
      if (result.category.isActive) {
        setActiveCategories(prev => [...prev, result.category])
      } else {
        setActiveCategories(prev => prev.filter(cat => cat.id !== id))
      }
      
      toast.success(
        `Category ${result.category.isActive ? 'activated' : 'deactivated'} successfully`
      )
      return { success: true, category: result.category }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update category status'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  useEffect(() => {
    fetchActiveCategories()
  }, [])

  const value = {
    // Donation state & methods
    donations,
    deletedDonations, // NEW
    loading,
    updating, // NEW
    pagination,
    deletedPagination, // NEW
    filters,
    fetchDonations,
    fetchMyDonations,
    fetchDeletedDonations, // NEW
    createDonation,
    updateDonation, // NEW
    getDonationHistory, // NEW
    deleteDonation, // NEW
    restoreDonation, // NEW
    setFilters,
    clearFilters,
    
    // Email state & methods
    emailSending,
    emailStatus,
    sendReceiptEmail,
    resendReceiptEmail,
    getEmailStatus,
    
    // Donor search state & methods
    donorSearchResults,
    donorSearchLoading,
    searchDonors,
    getDonorSuggestions,
    getDonorByPhone,
    clearDonorSearch,
    
    // Category state & methods
    categories,
    activeCategories,
    categoriesLoading,
    categoryPagination,
    fetchCategories,
    fetchActiveCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    
    // History state
    donationHistory // NEW
  }

  return (
    <DonationContext.Provider value={value}>
      {children}
    </DonationContext.Provider>
  )
}