/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { 
  Tag, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Grid3x3,
  List,
  Download,
  CheckCircle,
  XCircle,
  ChevronDown,
  X,
  MoreVertical,
  AlertTriangle // Add this import
} from 'lucide-react'
import { useAdmin } from '../context/AdminContext.jsx'
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx'
import Pagination from '../components/Common/Pagination.jsx'
import { format } from 'date-fns'

const Categories = () => {
  const { 
    categories = [],
    selectedCategory,
    loading,
    fetchAllCategories,
    fetchCategoryById,
    createNewCategory,
    updateExistingCategory,
    deleteExistingCategory,
    toggleCategoryActiveStatus,
    exportDataToFile,
    clearSelectedCategory
  } = useAdmin()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    page: 1,
    limit: 12
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  })

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'Tag',
    color: '#3b82f6',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadCategories()
  }, [filters])

  const loadCategories = async () => {
    try {
      const data = await fetchAllCategories(filters.isActive || undefined)
      if (data && data.pagination) {
        setPagination({
          page: data.pagination.page || 1,
          limit: data.pagination.limit || 12,
          total: data.pagination.total || data.categories?.length || 0,
          pages: data.pagination.pages || 1
        })
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1
      })
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

  const clearFilters = () => {
    setFilters({
      search: '',
      isActive: '',
      page: 1,
      limit: 12
    })
    setIsFiltersOpen(false)
  }

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

  const handleAddCategory = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await createNewCategory(categoryForm)
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      // Error is handled by context
    }
  }

  const handleEditCategory = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await updateExistingCategory(selectedCategory.id, categoryForm)
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      // Error is handled by context
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategoryForAction) return
    
    try {
      await deleteExistingCategory(selectedCategoryForAction.id)
      setShowDeleteModal(false)
      setSelectedCategoryForAction(null)
    } catch (error) {
      // Error is handled by context
    }
  }

  const handleToggleStatus = async (category) => {
    try {
      await toggleCategoryActiveStatus(category.id)
    } catch (error) {
      // Error is handled by context
    }
  }

  const handleExport = async () => {
    try {
      await exportDataToFile('categories', filters)
    } catch (error) {
      // Error is handled by context
    }
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

  const prepareEdit = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Tag',
      color: category.color || '#3b82f6',
      isActive: category.isActive
    })
    fetchCategoryById(category.id)
    setShowEditModal(true)
  }

  const prepareDelete = (category) => {
    setSelectedCategoryForAction(category)
    setShowDeleteModal(true)
  }

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#f97316', label: 'Orange' }
  ]

  const iconOptions = [
    { value: 'Tag', label: 'Tag' },
    { value: 'Home', label: 'Home' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Book', label: 'Book' },
    { value: 'DollarSign', label: 'Dollar' },
    { value: 'Users', label: 'Users' },
    { value: 'Building', label: 'Building' },
    { value: 'GraduationCap', label: 'Graduation' }
  ]

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !filters.search || 
      category.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(filters.search.toLowerCase()))
    
    const matchesStatus = !filters.isActive || 
      (filters.isActive === 'true' && category.isActive) ||
      (filters.isActive === 'false' && !category.isActive)
    
    return matchesSearch && matchesStatus
  }).slice(
    (filters.page - 1) * filters.limit,
    filters.page * filters.limit
  )

  const totalCategories = categories.length || 0
  const activeCategories = categories.filter(c => c.isActive).length
  const inactiveCategories = categories.filter(c => !c.isActive).length

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total Categories</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                {totalCategories}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-blue-50 rounded-full">
              <Tag className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Active</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                {activeCategories}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-green-50 rounded-full">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Inactive</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                {inactiveCategories}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-gray-100 rounded-full">
              <XCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-hover p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2" />
            <h3 className="text-sm md:text-base font-medium text-gray-900">Filters</h3>
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="btn btn-outline text-xs py-1.5 px-2 md:py-2 md:px-3"
          >
            {isFiltersOpen ? 'Show Less' : 'More Filters'}
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-8 md:pl-10 text-xs md:text-sm py-2"
                placeholder="Search categories..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Status
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="input text-xs md:text-sm py-2"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Sort By
            </label>
            <select className="input text-xs md:text-sm py-2">
              <option>Name A-Z</option>
              <option>Newest First</option>
              <option>Most Used</option>
            </select>
          </div>
        </div>

        {isFiltersOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-up">
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Created After
                </label>
                <input
                  type="date"
                  className="input text-xs md:text-sm py-2"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Created Before
                </label>
                <input
                  type="date"
                  className="input text-xs md:text-sm py-2"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="btn btn-outline text-xs md:text-sm w-full py-2"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Content */}
      {loading && categories.length === 0 ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Tag className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-sm md:text-base text-gray-500">
            {filters.search || filters.isActive ? 'Try adjusting your filters' : 'Create your first category to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="card card-hover p-4 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: category.color || '#3b82f6' }}
                  >
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                      {category.name}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      const menu = document.getElementById(`menu-${category.id}`)
                      if (menu) menu.classList.toggle('hidden')
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div 
                    id={`menu-${category.id}`}
                    className="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                  >
                    <button
                      onClick={() => prepareEdit(category)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Edit2 className="w-3 h-3 mr-2" />
                      Edit Category
                    </button>
                    <button
                      onClick={() => handleToggleStatus(category)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      {category.isActive ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-2" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => prepareDelete(category)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete Category
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-4 line-clamp-2">
                {category.description || 'No description provided'}
              </p>
              
              <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>ID: {category.id ? category.id.substring(0, 8) : 'N/A'}...</span>
                  {category.donationCount && (
                    <span className="font-medium text-gray-900">
                      {category.donationCount} donations
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card card-hover overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Donations</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                          style={{ backgroundColor: category.color || '#3b82f6' }}
                        >
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm md:text-base font-medium text-gray-900">
                            {category.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {category.id ? category.id.substring(0, 8) : 'N/A'}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${category.isActive ? 'badge-success' : 'badge-danger'} text-xs`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <span className="text-sm md:text-base font-semibold text-gray-900">
                          {category.donationCount || 0}
                        </span>
                        <div className="text-xs text-gray-500">donations</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">
                        {category.createdAt ? format(new Date(category.createdAt), 'dd MMM yyyy') : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                          onClick={() => prepareEdit(category)}
                          className="p-1.5 md:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleStatus(category)}
                          className={`p-1.5 md:p-2 rounded-lg ${category.isActive 
                            ? 'text-amber-600 hover:bg-amber-50' 
                            : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={category.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {category.isActive ? (
                            <EyeOff className="w-3 h-3 md:w-4 md:h-4" />
                          ) : (
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => prepareDelete(category)}
                          className="p-1.5 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCategories.length > 0 && (
            <Pagination
              currentPage={filters.page}
              totalPages={Math.ceil(categories.length / filters.limit)}
              onPageChange={handlePageChange}
              pageSize={filters.limit}
              onPageSizeChange={handlePageSizeChange}
              totalItems={categories.length}
            />
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <CategoryModal
          type="add"
          formData={categoryForm}
          setFormData={setCategoryForm}
          formErrors={formErrors}
          onSubmit={handleAddCategory}
          onClose={() => {
            setShowAddModal(false)
            resetForm()
          }}
          colorOptions={colorOptions}
          iconOptions={iconOptions}
          loading={loading}
        />
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <CategoryModal
          type="edit"
          formData={categoryForm}
          setFormData={setCategoryForm}
          formErrors={formErrors}
          onSubmit={handleEditCategory}
          onClose={() => {
            setShowEditModal(false)
            clearSelectedCategory()
            resetForm()
          }}
          colorOptions={colorOptions}
          iconOptions={iconOptions}
          loading={loading}
          category={selectedCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategoryForAction && (
        <DeleteConfirmationModal
          category={selectedCategoryForAction}
          onConfirm={handleDeleteCategory}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedCategoryForAction(null)
          }}
          loading={loading}
        />
      )}

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10 animate-slide-up">
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex flex-col items-center p-2 text-blue-600"
            aria-label="Add category"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1">Add</span>
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="flex flex-col items-center p-2 text-gray-600"
            aria-label="Toggle view"
          >
            {viewMode === 'list' ? (
              <Grid3x3 className="w-5 h-5" />
            ) : (
              <List className="w-5 h-5" />
            )}
            <span className="text-xs mt-1">{viewMode === 'list' ? 'Grid' : 'List'}</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex flex-col items-center p-2 text-gray-600"
            aria-label="Export"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs mt-1">Export</span>
          </button>
          
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex flex-col items-center p-2 text-gray-600"
            aria-label="Filters"
          >
            <Filter className={`w-5 h-5 ${isFiltersOpen ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className="text-xs mt-1">Filters</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Components
const CategoryModal = ({ 
  type, 
  formData, 
  setFormData, 
  formErrors, 
  onSubmit, 
  onClose, 
  colorOptions,
  iconOptions,
  loading,
  category
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                {type === 'add' ? 'Create New Category' : 'Edit Category'}
              </h3>
              {category && category.id && (
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  ID: {category.id.substring(0, 8)}...
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 text-xl"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-3 md:space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`input text-xs md:text-sm py-2 ${formErrors.name ? 'input-error' : ''}`}
                placeholder="e.g., Temple Maintenance"
                maxLength={100}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`input text-xs md:text-sm py-2 min-h-[80px] ${formErrors.description ? 'input-error' : ''}`}
                placeholder="Brief description of this category..."
                maxLength={500}
                rows="3"
              />
              <div className="flex justify-between mt-1">
                {formErrors.description && (
                  <p className="text-xs text-red-600">{formErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>
            
            {/* Color & Icon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`h-8 rounded-lg flex items-center justify-center ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-blue-500' 
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                      aria-label={color.label}
                    >
                      {formData.color === color.value && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="input text-xs md:text-sm py-2"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-3 w-3 md:h-4 md:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-xs md:text-sm text-gray-900">
                Active Category
              </label>
            </div>
            
            {/* Preview */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: formData.color }}
                >
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm md:text-base font-medium text-gray-900">
                    {formData.name || 'Category Name'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description || 'No description'}
                  </div>
                </div>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-2 md:space-x-3 pt-4 md:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline text-xs md:text-sm py-2 px-3 md:px-4"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary text-xs md:text-sm py-2 px-3 md:px-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                    {type === 'add' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  type === 'add' ? 'Create Category' : 'Update Category'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const DeleteConfirmationModal = ({ category, onConfirm, onClose, loading }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Delete Category
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {category.id ? category.id.substring(0, 8) : 'N/A'}...
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 text-xl"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 md:p-4 bg-red-50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Warning: This action cannot be undone</h4>
                  <p className="text-xs text-red-700 mt-1">
                    Deleting this category will remove it permanently. 
                    {category.donationCount > 0 && (
                      <span className="font-semibold"> {category.donationCount} donations</span>
                    )} associated with this category will not be affected but will have no category assigned.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                >
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-gray-900">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {category.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-xs md:text-sm text-gray-600 space-y-1">
              <p>📅 Created: {category.createdAt ? format(new Date(category.createdAt), 'PPP') : 'Unknown'}</p>
              <p>📊 Donations: {category.donationCount || 0}</p>
              <p>📈 Status: <span className={category.isActive ? 'text-green-600' : 'text-gray-600'}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span></p>
            </div>
            
            <div className="flex justify-end space-x-2 md:space-x-3 pt-4 md:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline text-xs md:text-sm py-2 px-3 md:px-4"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="btn btn-danger text-xs md:text-sm py-2 px-3 md:px-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Categories