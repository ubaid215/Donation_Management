import asyncHandler from 'express-async-handler';
import { PDFReportGenerator } from './pdfGenerator.js';
import { DonationRepository } from '../donations/repository.js';

const pdfGenerator = new PDFReportGenerator();
const donationRepository = new DonationRepository();

// ─── Full Donation Report ──────────────────────────────────────────────────────
export const generateDonationReport = asyncHandler(async (req, res) => {
  try {
    const filters = req.query;

    // Increase limit to get all donations for report (override pagination)
    const reportFilters = { ...filters, limit: 10000, page: 1 };

    const { donations } = await donationRepository.findAll(reportFilters);

    const pdfBuffer = await pdfGenerator.generateDonationReport(
      donations || [],
      filters,
      process.env.ORG_NAME || 'Donation Management Khanqah'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=donation-report-${new Date().toISOString().split('T')[0]}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ─── Per-Category Report ───────────────────────────────────────────────────────
export const generateCategoryReport = asyncHandler(async (req, res) => {
  try {
    const { categoryId, categoryName, ...restFilters } = req.query;

    if (!categoryId && !categoryName) {
      return res.status(400).json({
        success: false,
        message: 'categoryId or categoryName query parameter is required'
      });
    }

    // Build filters: include categoryId OR filter by purpose name
    const reportFilters = { ...restFilters, limit: 10000, page: 1 };
    if (categoryId) reportFilters.categoryId = categoryId;
    if (categoryName && !categoryId) reportFilters.purpose = categoryName;

    const { donations } = await donationRepository.findAll(reportFilters);

    const resolvedName = categoryName || `Category ${categoryId}`;

    const pdfBuffer = await pdfGenerator.generateCategoryReport(
      donations || [],
      resolvedName,
      { categoryName: resolvedName, ...restFilters },
      process.env.ORG_NAME || 'Donation Management Khanqah'
    );

    const safeName = resolvedName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Category report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate category report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ─── Analytics Report ──────────────────────────────────────────────────────────
export const generateAnalyticsReport = asyncHandler(async (req, res) => {
  try {
    const { timeframe } = req.query;

    const analytics = await donationRepository.getAnalytics(timeframe || 'month');

    const pdfBuffer = await pdfGenerator.generateAnalyticsReport(
      analytics,
      timeframe,
      process.env.ORG_NAME || 'Donation Management Khanqah'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Analytics report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});