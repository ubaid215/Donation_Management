/* eslint-disable react-hooks/immutability */
// pages/Donations/DeletedDonations.jsx
import React, { useEffect, useState } from 'react'
import { Trash2, RotateCcw, Eye, Search, Filter } from 'lucide-react'
import { useDonations } from '../context/DonationContext.jsx'
import DeletedDonationList from '../components/Donations/DeletedDonationList.jsx'
import Pagination from '../components/Common/Pagination.jsx'

const DeletedDonations = () => {
  const { fetchDeletedDonations, deletedDonations, deletedPagination, restoreDonation } = useDonations()
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',  
    page: 1,
    limit: 20
  })

  useEffect(() => {
    loadDeletedDonations()
  }, [filters.page, filters.limit])

  const loadDeletedDonations = async () => {
    setLoading(true)
    await fetchDeletedDonations(filters)
    setLoading(false)
  }

  const handleRestore = async (donationId) => {
    const confirmed = window.confirm('Are you sure you want to restore this donation?')
    if (!confirmed) return

    const result = await restoreDonation(donationId, 'Restored by admin')
    if (result.success) {
      loadDeletedDonations()
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, page: 1 }))
    loadDeletedDonations()
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20
    })
    loadDeletedDonations()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Deleted Donations
          </h1>
          <p className="text-gray-600 mt-1">
            View and restore soft-deleted donation records
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Trash2 className="w-4 h-4" />
          <span>
            {deletedPagination.total} deleted donations found
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by donor name, phone, or email..."
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Filter className="w-4 h-4 mr-2" />
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-outline"
              disabled={loading}
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deleted From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deleted To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Deleted Donations List */}
      <DeletedDonationList 
        donations={deletedDonations}
        loading={loading}
        onRestore={handleRestore}
      />

      {/* Pagination */}
      {deletedDonations.length > 0 && (
        <div className="card">
          <Pagination
            currentPage={deletedPagination.page}
            totalPages={deletedPagination.pages}
            onPageChange={handlePageChange}
            pageSize={deletedPagination.limit}
            onPageSizeChange={handlePageSizeChange}
            totalItems={deletedPagination.total}
          />
        </div>
      )}
    </div>
  )
}

export default DeletedDonations