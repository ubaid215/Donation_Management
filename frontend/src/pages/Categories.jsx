/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Plus, List, Grid3x3, Download } from 'lucide-react'
import { useDonations } from '../context/DonationContext.jsx'
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx'
import {
  CategoryStats,
  CategoryFilters,
  CategoryGridView,
  CategoryListView,
  CategoryFormModal,
  CategoryDeleteModal,
  CategoryEmptyState,
  CategoryMobileBottomBar
} from '../components/categories'

const Categories = () => {
  const { 
    categories,
    categoriesLoading,
    categoryPagination,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
  } = useDonations()
  
  // UI State
  const [viewMode, setViewMode] = useState('list')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    page: 1,
    limit: 12
  })
  
  // Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'Tag',
    color: '#3b82f6',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState({})

  // Load categories on mount and filter change
  useEffect(() => {
    loadCategories()
  }, [filters])

  const loadCategories = async () => {
    const filterParams = {
      ...(filters.isActive && { isActive: filters.isActive }),
      ...(filters.search && { search: filters.search }),
      page: filters.page,
      limit: filters.limit
    }
    await fetchCategories(filterParams)
  }

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      isActive: '',
      page: 1,
      limit: 12
    })
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    
    if (!categoryForm.name.trim()) {
      errors.name = 'Category name is required'
    } else if (categoryForm.name.length < 2) {
      errors.name = 'Category name must be at least 2 characters'
    }
    
    if (categoryForm.description && categoryForm.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: 'Tag',
      color: '#3b82f6',
      isActive: true
    })
    setFormErrors({})
  }

  // CRUD Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const result = await createCategory(categoryForm)
    if (result.success) {
      setShowAddModal(false)
      resetForm()
      loadCategories()
    }
  }

  const handleEditCategory = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const result = await updateCategory(selectedCategory.id, categoryForm)
    if (result.success) {
      setShowEditModal(false)
      setSelectedCategory(null)
      resetForm()
      loadCategories()
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return
    
    const result = await deleteCategory(selectedCategory.id)
    if (result.success) {
      setShowDeleteModal(false)
      setSelectedCategory(null)
      loadCategories()
    }
  }

  const handleToggleStatus = async (category) => {
    await toggleCategoryStatus(category.id)
    loadCategories()
  }

  // Modal handlers
  const prepareEdit = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Tag',
      color: category.color || '#3b82f6',
      isActive: category.isActive
    })
    setSelectedCategory(category)
    setShowEditModal(true)
  }

  const prepareDelete = (category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleExport = async () => {
    // TODO: Implement export functionality
    console.log('Export categories:', filters)
  }

  // Apply client-side filtering for search
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !filters.search || 
      category.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(filters.search.toLowerCase()))
    
    return matchesSearch
  })

  const hasFilters = filters.search || filters.isActive

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Categories Management
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Manage donation categories and purposes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button
              onClick={handleExport}
              className="btn btn-outline text-xs py-2 px-3"
            >
              <Download className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">Export</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="btn btn-primary text-xs md:text-sm py-2 px-3 md:px-4"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline ml-1">New Category</span>
            <span className="xs:hidden ml-1">New</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <CategoryStats categories={categories} />

      {/* Filters */}
      <CategoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Categories Content */}
      {categoriesLoading && categories.length === 0 ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : filteredCategories.length === 0 ? (
        <CategoryEmptyState hasFilters={hasFilters} />
      ) : viewMode === 'grid' ? (
        <CategoryGridView
          categories={filteredCategories}
          onEdit={prepareEdit}
          onDelete={prepareDelete}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <CategoryListView
          categories={filteredCategories}
          onEdit={prepareEdit}
          onDelete={prepareDelete}
          onToggleStatus={handleToggleStatus}
          pagination={categoryPagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          totalItems={categoryPagination.total}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <CategoryFormModal
          type="add"
          formData={categoryForm}
          setFormData={setCategoryForm}
          formErrors={formErrors}
          onSubmit={handleAddCategory}
          onClose={() => {
            setShowAddModal(false)
            resetForm()
          }}
          loading={categoriesLoading}
        />
      )}

      {showEditModal && selectedCategory && (
        <CategoryFormModal
          type="edit"
          formData={categoryForm}
          setFormData={setCategoryForm}
          formErrors={formErrors}
          onSubmit={handleEditCategory}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCategory(null)
            resetForm()
          }}
          loading={categoriesLoading}
          category={selectedCategory}
        />
      )}

      {showDeleteModal && selectedCategory && (
        <CategoryDeleteModal
          category={selectedCategory}
          onConfirm={handleDeleteCategory}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedCategory(null)
          }}
          loading={categoriesLoading}
        />
      )}

      {/* Mobile Bottom Bar */}
      <CategoryMobileBottomBar
        viewMode={viewMode}
        onViewModeChange={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        onAddClick={() => {
          resetForm()
          setShowAddModal(true)
        }}
        onExportClick={handleExport}
        isFiltersOpen={false}
        onToggleFilters={() => {}}
      />
    </div>
  )
}

export default Categories