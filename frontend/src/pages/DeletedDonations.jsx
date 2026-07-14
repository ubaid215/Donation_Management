// pages/DeletedDonations.jsx
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Calendar, 
  Phone, 
  User, 
  FileText,
  CreditCard,
  Building,
  Smartphone,
  HandCoins,
  History,
  Mail,
  MessageCircle,
  RotateCcw,
  AlertCircle,
  Search,
  Filter,
  X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDonations } from '../context/DonationContext'
import DonationHistoryModal from '../components/Donations/DonationHistoryModal'
import toast from 'react-hot-toast'

const DeletedDonations = () => {
  const { user } = useAuth()
  const { 
    deletedDonations, 
    loading, 
    fetchDeletedDonations, 
    restoreDonation,
    deletedPagination 
  } = useDonations()
  
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [restoreReason, setRestoreReason] = useState('')
  const [restoring, setRestoring] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    purpose: '',
    paymentMethod: ''
  })

  useEffect(() => {
    if (user.role === 'ADMIN') {
      fetchDeletedDonations()
    }
  }, [user.role])

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CASH': return <FileText className="w-4 h-4" />
      case 'CARD': return <CreditCard className="w-4 h-4" />
      case 'BANK_TRANSFER': return <Building className="w-4 h-4" />
      case 'UPI': return <Smartphone className="w-4 h-4" />
      case 'CHEQUE': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleViewHistory = (donation) => {
    setSelectedDonation(donation)
    setShowHistoryModal(true)
  }

  const handleRestoreClick = (donation) => {
    setSelectedDonation(donation)
    setRestoreReason('')
    setShowRestoreModal(true)
  }

  const handleRestore = async () => {
    if (!restoreReason.trim()) {
      toast.error('Please provide a reason for restoring this donation')
      return
    }

    try {
      setRestoring(true)
      const result = await restoreDonation(selectedDonation.id, restoreReason)
      
      if (result.success) {
        setShowRestoreModal(false)
        setSelectedDonation(null)
        setRestoreReason('')
        fetchDeletedDonations() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to restore donation:', error)
    } finally {
      setRestoring(false)
    }
  }

  const handleSearch = () => {
    fetchDeletedDonations({ 
      search: searchTerm,
      ...filters 
    })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilters({
      startDate: '',
      endDate: '',
      purpose: '',
      paymentMethod: ''
    })
    fetchDeletedDonations()
  }

  // Filter donations based on search term
  const filteredDonations = deletedDonations.filter(donation => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      donation.donorName?.toLowerCase().includes(search) ||
      donation.donorPhone?.includes(search) ||
      donation.donorEmail?.toLowerCase().includes(search) ||
      donation.purpose?.toLowerCase().includes(search)
    )
  })

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can view deleted donations.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading deleted donations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Deleted Donations
          </h1>
          <p className="text-gray-600">
            View and restore soft-deleted donations
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="card mb-6">
          <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input pl-10 w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
                <button
                  onClick={handleSearch}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by purpose"
                      value={filters.purpose}
                      onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={filters.paymentMethod}
                      onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">All Methods</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-secondary text-sm flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Total Deleted</div>
            <div className="text-2xl font-bold text-gray-900">
              {deletedPagination.total || 0}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Showing</div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredDonations.length}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Current Page</div>
            <div className="text-2xl font-bold text-gray-900">
              {deletedPagination.page} of {deletedPagination.pages}
            </div>
          </div>
        </div>

        {/* Donations List */}
        {filteredDonations.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <HandCoins className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted donations found</h3>
              <p className="text-gray-500">There are no deleted donations to display.</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Mobile View */}
            <div className="block lg:hidden">
              <div className="p-4 space-y-4">
                {filteredDonations.map((donation) => (
                  <div key={donation.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">
                            {format(new Date(donation.date), 'dd MMM yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(donation.date), 'hh:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleRestoreClick(donation)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Restore donation"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewHistory(donation)}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                          title="View history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center text-gray-900 mb-1">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{donation.donorName}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 ml-6">
                          <Phone className="w-3 h-3 mr-1" />
                          {donation.donorPhone}
                        </div>
                        {donation.donorEmail && (
                          <div className="flex items-center text-sm text-gray-500 ml-6 mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {donation.donorEmail}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center font-bold text-gray-900">
                          {formatAmount(donation.amount)}
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          {getPaymentMethodIcon(donation.paymentMethod)}
                          <span className="ml-2">
                            {donation.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Deleted Info */}
                      <div className="pt-2 border-t border-red-200">
                        <div className="text-xs text-red-600 mb-1">
                          Deleted on: {format(new Date(donation.deletedAt), 'dd MMM yyyy, hh:mm a')}
                        </div>
                        {donation.deletionReason && (
                          <div className="text-xs text-gray-600">
                            Reason: {donation.deletionReason}
                          </div>
                        )}
                        {donation.deletedBy && (
                          <div className="text-xs text-gray-600">
                            By: {donation.deletedBy.name}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="badge badge-info text-xs">
                          {donation.purpose}
                        </span>
                        <span className="badge badge-danger text-xs">
                          Deleted
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date & Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Donor Details</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Purpose</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Deleted Info</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDonations.map((donation) => (
                    <tr 
                      key={donation.id} 
                      className="hover:bg-red-50 transition-colors bg-red-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(donation.date), 'dd MMM yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(donation.date), 'hh:mm a')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center font-medium text-gray-900">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            {donation.donorName}
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3 mr-1" />
                            {donation.donorPhone}
                          </div>
                          {donation.donorEmail && (
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3 mr-1" />
                              {donation.donorEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center font-bold text-gray-900">
                          {formatAmount(donation.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge badge-info">
                          {donation.purpose}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(donation.paymentMethod)}
                          <span className="ml-2 text-sm text-gray-700">
                            {donation.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs space-y-1">
                          <div className="text-red-600 font-medium">
                            {format(new Date(donation.deletedAt), 'dd MMM yyyy')}
                          </div>
                          <div className="text-gray-500">
                            {format(new Date(donation.deletedAt), 'hh:mm a')}
                          </div>
                          {donation.deletedBy && (
                            <div className="text-gray-600">
                              By: {donation.deletedBy.name}
                            </div>
                          )}
                          {donation.deletionReason && (
                            <div className="text-gray-600 mt-1 max-w-xs truncate" title={donation.deletionReason}>
                              {donation.deletionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRestoreClick(donation)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Restore donation"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewHistory(donation)}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                            title="View history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {deletedPagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => fetchDeletedDonations({ ...filters, page: deletedPagination.page - 1 })}
                disabled={deletedPagination.page === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-gray-700">
                Page {deletedPagination.page} of {deletedPagination.pages}
              </span>
              <button
                onClick={() => fetchDeletedDonations({ ...filters, page: deletedPagination.page + 1 })}
                disabled={deletedPagination.page === deletedPagination.pages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <RotateCcw className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Restore Donation</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to restore this donation from <strong>{selectedDonation.donorName}</strong> for <strong>{formatAmount(selectedDonation.amount)}</strong>?
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Restoration <span className="text-red-500">*</span>
              </label>
              <textarea
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                placeholder="Please provide a reason for restoring this donation..."
                rows={4}
                className="input w-full resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestoreModal(false)
                  setSelectedDonation(null)
                  setRestoreReason('')
                }}
                className="btn btn-secondary"
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring || !restoreReason.trim()}
                className="btn btn-success flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedDonation && (
        <DonationHistoryModal
          donationId={selectedDonation.id}
          onClose={() => {
            setShowHistoryModal(false)
            setSelectedDonation(null)
          }}
        />
      )}
    </div>
  )
}

export default DeletedDonations