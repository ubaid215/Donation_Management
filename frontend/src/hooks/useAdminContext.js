// hooks/useAdminContext.js
import { useAdmin } from '../context/AdminContext.js';

export const useAdminContext = () => {
  const context = useAdmin();
  
  // Helper functions for common operations
  const getCategoryById = (id) => {
    return context.categories.find(cat => cat.id === id);
  };

  const getActiveCategories = () => {
    return context.categories.filter(cat => cat.isActive);
  };

  const getInactiveCategories = () => {
    return context.categories.filter(cat => !cat.isActive);
  };

  const formatCurrency = (amount) => {
    return `Rs ${Number(amount).toLocaleString('en-PK')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    ...context,
    getCategoryById,
    getActiveCategories,
    getInactiveCategories,
    formatCurrency,
    formatDate,
    formatDateTime
  };
};