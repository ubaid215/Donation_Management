import asyncHandler from 'express-async-handler';
import { AdminService } from './admin.service.js';
import { AnalyticsService } from './analytics.js';

const adminService = new AdminService();
const analyticsService = new AnalyticsService();

export const getSystemStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getSystemStats();
  
  res.json({
    success: true,
    stats
  });
});

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await analyticsService.getDashboardMetrics();
  
  res.json({
    success: true,
    metrics
  });
});

export const getDonationInsights = asyncHandler(async (req, res) => {
  const insights = await adminService.getDonationInsights(req.query.timeframe);
  
  res.json({
    success: true,
    insights
  });
});

export const getTimeSeriesData = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'startDate and endDate are required'
    });
  }
  
  const data = await analyticsService.getTimeSeriesData(
    new Date(startDate),
    new Date(endDate)
  );
  
  res.json({
    success: true,
    data
  });
});

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await analyticsService.getCategoryBreakdown();
  
  res.json({
    success: true,
    breakdown
  });
});

export const getOperatorPerformance = asyncHandler(async (req, res) => {
  const performance = await analyticsService.getOperatorPerformance();
  
  res.json({
    success: true,
    performance
  });
});

export const exportData = asyncHandler(async (req, res) => {
  const { exportType } = req.params;
  const filters = req.query;
  filters.adminId = req.user.id;
  
  const data = await adminService.exportData(exportType, filters);
  
  res.json({
    success: true,
    data
  });
});

// ==================== Category Management ====================

export const getAllCategories = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  
  const categories = await adminService.getAllCategories(
    isActive !== undefined ? isActive === 'true' : undefined
  );
  
  res.json({
    success: true,
    categories
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await adminService.getCategoryById(id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    category
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Category name is required'
    });
  }
  
  const category = await adminService.createCategory({
    name,
    description,
    isActive,
    adminId: req.user.id
  });
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;
  
  const category = await adminService.updateCategory(id, {
    name,
    description,
    isActive,
    adminId: req.user.id
  });
  
  res.json({
    success: true,
    message: 'Category updated successfully',
    category
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await adminService.deleteCategory(id, req.user.id);
  
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await adminService.toggleCategoryStatus(id, req.user.id);
  
  res.json({
    success: true,
    message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
    category
  });
});