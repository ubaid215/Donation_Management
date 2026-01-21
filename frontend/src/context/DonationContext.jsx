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
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
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

  // ===== DONOR SEARCH OPERATIONS =====

  // Search donors with full details
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

  // Get donor suggestions for autocomplete
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

  // Get donor by phone number
  const getDonorByPhone = async (phone) => {
    if (!phone || phone.trim().length === 0) {
      return null
    }

    try {
      const result = await donationService.getDonorByPhone(phone)
      return result.success ? result.donor : null
    } catch (error) {
      // Don't show error toast for 404 (donor not found)
      if (error.response?.status !== 404) {
        console.error('Failed to get donor by phone:', error)
      }
      return null
    }
  }

  // Clear donor search results
  const clearDonorSearch = () => {
    setDonorSearchResults([])
  }

  // ===== CATEGORY OPERATIONS =====
  
  // Fetch all categories with filters
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

  // Fetch only active categories (for dropdowns)
  const fetchActiveCategories = async () => {
    try {
      const result = await donationService.getActiveCategories()
      // Handle the response structure
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

  // Create new category
  const createCategory = async (categoryData) => {
    try {
      setCategoriesLoading(true)
      const result = await donationService.createCategory(categoryData)
      
      setCategories(prev => [result.category, ...prev])
      
      // If category is active, add to active categories list
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

  // Update category
  const updateCategory = async (id, categoryData) => {
    try {
      setCategoriesLoading(true)
      const result = await donationService.updateCategory(id, categoryData)
      
      // Update in categories list
      setCategories(prev =>
        prev.map(cat => (cat.id === id ? result.category : cat))
      )
      
      // Update in active categories list
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

  // Delete category
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

  // Toggle category status
  const toggleCategoryStatus = async (id) => {
    try {
      const result = await donationService.toggleCategoryStatus(id)
      
      // Update in categories list
      setCategories(prev =>
        prev.map(cat => (cat.id === id ? result.category : cat))
      )
      
      // Update active categories list
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

  // Load active categories on mount (for form dropdowns)
  useEffect(() => {
    fetchActiveCategories()
  }, [])

  const value = {
    // Donation state & methods
    donations,
    loading,
    pagination,
    filters,
    fetchDonations,
    fetchMyDonations,
    createDonation,
    setFilters,
    clearFilters,
    
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
    toggleCategoryStatus
  }

  return (
    <DonationContext.Provider value={value}>
      {children}
    </DonationContext.Provider>
  )
}