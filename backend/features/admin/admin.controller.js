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