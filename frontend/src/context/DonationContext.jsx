/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react'
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
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  })
  const [filters, setFilters] = useState({})

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

  const value = {
    donations,
    loading,
    pagination,
    filters,
    fetchDonations,
    fetchMyDonations,
    createDonation,
    setFilters,
    clearFilters
  }

  return (
    <DonationContext.Provider value={value}>
      {children}
    </DonationContext.Provider>
  )
}