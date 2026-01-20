/* eslint-disable react-refresh/only-export-components */
// context/AdminContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import adminService from '../services/adminService.js';
import toast from 'react-hot-toast';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [operatorPerformance, setOperatorPerformance] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exportData, setExportData] = useState(null);

  // System Stats
  const fetchSystemStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemStats();
      setSystemStats(response.stats || null);
      return response.stats || null;
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load system statistics';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Dashboard Metrics
  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardMetrics();
      setDashboardMetrics(response.metrics || null);
      return response.metrics || null;
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load dashboard metrics';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Donation Insights
  const fetchDonationInsights = useCallback(async (timeframe = 'month') => {
    try {
      setLoading(true);
      const response = await adminService.getDonationInsights(timeframe);
      setInsights(response.insights || null);
      return response.insights || null;
    } catch (error) {
      console.error('Failed to fetch donation insights:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load donation insights';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Time Series Data
  const fetchTimeSeriesData = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await adminService.getTimeSeriesData(startDate, endDate);
      setTimeSeriesData(response.data || null);
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch time series data:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load time series data';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Category Breakdown
  const fetchCategoryBreakdown = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getCategoryBreakdown();
      setCategoryBreakdown(response.breakdown || null);
      return response.breakdown || null;
    } catch (error) {
      console.error('Failed to fetch category breakdown:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load category breakdown';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Operator Performance
  const fetchOperatorPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getOperatorPerformance();
      setOperatorPerformance(response.performance || null);
      return response.performance || null;
    } catch (error) {
      console.error('Failed to fetch operator performance:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load operator performance';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Categories Management - CORRECTED for your backend structure
  const fetchAllCategories = useCallback(async (isActive) => {
    try {
      setLoading(true);
      const response = await adminService.getAllCategories(isActive);
      
      // Your backend returns: { success: true, categories: [...] }
      const categoriesData = response.categories || [];
      setCategories(categoriesData);
      
      return {
        categories: categoriesData,
        pagination: {
          page: 1,
          limit: 12,
          total: categoriesData.length || 0,
          pages: 1
        }
      };
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load categories';
      toast.error(errorMessage);
      setCategories([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategoryById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await adminService.getCategoryById(id);
      
      // Your backend returns: { success: true, category: {...} }
      const categoryData = response.category || null;
      setSelectedCategory(categoryData);
      
      return {
        category: categoryData
      };
    } catch (error) {
      console.error('Failed to fetch category:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load category';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewCategory = useCallback(async (categoryData) => {
    try {
      setLoading(true);
      const response = await adminService.createCategory(categoryData);
      
      // Your backend returns: { success: true, message: "...", category: {...} }
      const newCategory = response.category || null;
      const successMessage = response.message || 'Category created successfully';
      
      // Update local state
      if (newCategory) {
        setCategories(prev => [newCategory, ...prev]);
      }
      
      toast.success(successMessage);
      return {
        category: newCategory,
        message: successMessage
      };
    } catch (error) {
      console.error('Failed to create category:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create category';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExistingCategory = useCallback(async (id, categoryData) => {
    try {
      setLoading(true);
      const response = await adminService.updateCategory(id, categoryData);
      
      // Your backend returns: { success: true, message: "...", category: {...} }
      const updatedCategory = response.category || null;
      const successMessage = response.message || 'Category updated successfully';
      
      // Update local state
      if (updatedCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, ...categoryData } : cat
        ));
        if (selectedCategory?.id === id) {
          setSelectedCategory(prev => ({ ...prev, ...categoryData }));
        }
      }
      
      toast.success(successMessage);
      return {
        category: updatedCategory,
        message: successMessage
      };
    } catch (error) {
      console.error('Failed to update category:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update category';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const deleteExistingCategory = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await adminService.deleteCategory(id);
      
      // Your backend returns: { success: true, message: "..." }
      const successMessage = response.message || 'Category deleted successfully';
      
      // Update local state
      setCategories(prev => prev.filter(cat => cat.id !== id));
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
      }
      
      toast.success(successMessage);
      return {
        message: successMessage
      };
    } catch (error) {
      console.error('Failed to delete category:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete category';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const toggleCategoryActiveStatus = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await adminService.toggleCategoryStatus(id);
      
      // Your backend returns: { success: true, message: "...", category: {...} }
      const updatedCategory = response.category || null;
      const successMessage = response.message || 'Category status updated successfully';
      
      // Update local state
      if (updatedCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, isActive: updatedCategory.isActive } : cat
        ));
        if (selectedCategory?.id === id) {
          setSelectedCategory(updatedCategory);
        }
      }
      
      toast.success(successMessage);
      return {
        category: updatedCategory,
        message: successMessage
      };
    } catch (error) {
      console.error('Failed to toggle category status:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update category status';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Data Export
  const exportDataToFile = useCallback(async (exportType, filters = {}) => {
    try {
      setLoading(true);
      const response = await adminService.exportData(exportType, filters);
      
      // Your backend returns: { success: true, data: [...] }
      const exportDataContent = response.data || [];
      setExportData(exportDataContent);
      
      // Create download link for JSON exports
      if (exportDataContent && exportDataContent.length > 0) {
        const dataStr = JSON.stringify(exportDataContent, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${exportType}-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast.success(`${exportType} data exported successfully`);
      return response;
    } catch (error) {
      console.error('Failed to export data:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to export data';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear states
  const clearSelectedCategory = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const clearAllData = useCallback(() => {
    setSystemStats(null);
    setDashboardMetrics(null);
    setInsights(null);
    setTimeSeriesData(null);
    setCategoryBreakdown(null);
    setOperatorPerformance(null);
    setCategories([]);
    setSelectedCategory(null);
    setExportData(null);
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSystemStats(),
        fetchDashboardMetrics(),
        fetchDonationInsights(),
        fetchAllCategories()
      ]);
      toast.success('All data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh all data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchSystemStats, fetchDashboardMetrics, fetchDonationInsights, fetchAllCategories]);

  const value = {
    // State
    loading,
    systemStats,
    dashboardMetrics,
    insights,
    timeSeriesData,
    categoryBreakdown,
    operatorPerformance,
    categories,
    selectedCategory,
    exportData,
    
    // Actions
    fetchSystemStats,
    fetchDashboardMetrics,
    fetchDonationInsights,
    fetchTimeSeriesData,
    fetchCategoryBreakdown,
    fetchOperatorPerformance,
    fetchAllCategories,
    fetchCategoryById,
    createNewCategory,
    updateExistingCategory,
    deleteExistingCategory,
    toggleCategoryActiveStatus,
    exportDataToFile,
    clearSelectedCategory,
    clearAllData,
    refreshAllData,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;