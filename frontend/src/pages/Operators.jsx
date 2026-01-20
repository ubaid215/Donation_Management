/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Users, Download, UserPlus } from 'lucide-react'
import useAuth from '../hooks/useAuth.js'
import authService from '../services/authService.js'
import OperatorStats from '../components/operator/OperatorStats.jsx'
import OperatorFilters from '../components/operator/OperatorFilters.jsx'
import OperatorList from '../components/operator/OperatorList.jsx'
import AddOperatorModal from '../components/operator/AddOperatorModal.jsx'
import EditOperatorModal from '../components/operator/EditOperatorModal.jsx'
import MobileActionBar from '../components/operator/MobileActionBar.jsx'
import toast from 'react-hot-toast'

const Operators = () => {
  const { isAdmin } = useAuth()
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    if (isAdmin()) {
      fetchOperators()
    }
  }, [filters, isAdmin])

  const fetchOperators = async () => {
    try {
      setLoading(true)
      const data = await authService.getOperators(filters)
      setOperators(data.operators)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Failed to fetch operators')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    handleFilterChange('page', page)
  }

  const handlePageSizeChange = (limit) => {
    handleFilterChange('limit', limit)
  }

  const handleAddOperator = async (operatorData) => {
    try {
      await authService.createOperator(operatorData)
      toast.success('Operator created successfully')
      setShowAddModal(false)
      fetchOperators()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create operator')
    }
  }

  const handleEditOperator = async (id, updateData) => {
    try {
      await authService.updateOperator(id, updateData)
      toast.success('Operator updated successfully')
      setShowEditModal(false)
      fetchOperators()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update operator')
    }
  }

  const handleToggleStatus = async (operator) => {
    try {
      await authService.updateOperator(operator.id, { isActive: !operator.isActive })
      toast.success(`Operator ${operator.isActive ? 'deactivated' : 'activated'} successfully`)
      fetchOperators()
    } catch (error) {
      toast.error('Failed to update operator status')
    }
  }

  const handleExport = () => {
    // Implement export functionality
    toast.success('Export started')
  }

  if (!isAdmin()) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Users className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
        </div>
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
          Operator management is only available for administrators
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Operator Management
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Manage system operators and their permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="btn btn-outline text-xs md:text-sm py-2 px-3 md:py-2 md:px-4"
          >
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline ml-1">Export</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-xs md:text-sm py-2 px-3 md:py-2 md:px-4"
          >
            <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline ml-1">Add</span>
            <span className="xs:hidden ml-1">+</span>
          </button>
        </div>
      </div>

      <OperatorStats operators={operators} />
      
      <OperatorFilters 
        filters={filters}
        isFiltersOpen={isFiltersOpen}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
      />
      
      <OperatorList 
        operators={operators}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={(operator) => {
          setSelectedOperator(operator)
          setShowEditModal(true)
        }}
        onToggleStatus={handleToggleStatus}
      />

      {showAddModal && (
        <AddOperatorModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddOperator}
        />
      )}

      {showEditModal && selectedOperator && (
        <EditOperatorModal
          operator={selectedOperator}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOperator(null)
          }}
          onSubmit={handleEditOperator}
        />
      )}

      <MobileActionBar 
        onAdd={() => setShowAddModal(true)}
        onExport={handleExport}
        onFilter={() => setIsFiltersOpen(!isFiltersOpen)}
      />
    </div>
  )
}

export default Operators