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
      const donation = await donationService.createDonation(donationData)
      
      setDonations(prev => [donation, ...prev])
      toast.success('Donation recorded successfully')
      
      // Send notifications
      if (donationData.donorPhone) {
        toast.success('WhatsApp confirmation sent to donor')
      }
      
      return { success: true, donation }
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
      // The new endpoint should return { success: true, categories: [...] }
      if (result.data && result.data.success) {
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