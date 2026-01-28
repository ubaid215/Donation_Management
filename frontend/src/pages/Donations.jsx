// pages/Donations/Donations.jsx
import React, { useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import useDonations from '../hooks/useDonations.js'
import DonationForm from '../components/Donations/DonationForm.jsx'
import DonationList from '../components/Donations/DonationList.jsx'
import Filters from '../components/Donations/Filters.jsx'
import Pagination from '../components/Common/Pagination.jsx'

const Donations = () => {
  const { isAdmin } = useAuth()
  const { 
    donations, 
    loading, 
    pagination, 
    filters, 
    fetchDonations, 
    fetchMyDonations,
    setFilters,
    clearFilters 
  } = useDonations()

  useEffect(() => {
    if (isAdmin()) {
      fetchDonations()
    } else {
      fetchMyDonations()
    }
  }, [])

  const handleFilter = (newFilters) => {
    setFilters(newFilters)
    if (isAdmin()) {
      fetchDonations(newFilters)
    } else {
      fetchMyDonations(newFilters)
    }
  }

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page }
    handleFilter(newFilters)
  }

  const handlePageSizeChange = (limit) => {
    const newFilters = { ...filters, limit, page: 1 }
    handleFilter(newFilters)
  }

  const handleDonationCreated = () => {
    refreshDonations()
  }

  const handleDonationUpdated = () => {
    refreshDonations()
  }

  const handleDonationDeleted = () => {
    refreshDonations()
  }

  const refreshDonations = () => {
    if (isAdmin()) {
      fetchDonations(filters)
    } else {
      fetchMyDonations(filters)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin() ? 'All Donations' : 'My Donations'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin() 
              ? 'View and manage all donation records' 
              : 'View and record your donation entries'}
          </p>
        </div>
        
        {!isAdmin() && (
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-600">
              You can only view and edit your own records
            </span>
          </div>
        )}
      </div>

      {/* Donation Form */}
      
        <DonationForm onSubmitSuccess={handleDonationCreated} />
      

      {/* Filters */}
      <Filters 
        onFilter={handleFilter}
        onClear={clearFilters}
        initialFilters={filters}
      />

      {/* Donation List */}
      <DonationList 
        donations={donations} 
        loading={loading}
        onDonationUpdated={handleDonationUpdated}
        onDonationDeleted={handleDonationDeleted}
      />

      {/* Pagination */}
      {donations.length > 0 && (
        <div className="card">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            pageSize={pagination.limit}
            onPageSizeChange={handlePageSizeChange}
            totalItems={pagination.total}
          />
        </div>
      )}
    </div>
  )
}

export default Donations