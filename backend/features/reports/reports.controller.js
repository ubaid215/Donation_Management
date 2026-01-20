import asyncHandler from 'express-async-handler';
import { PDFReportGenerator } from './pdfGenerator.js';
import { DonationRepository } from '../donations/repository.js';

const pdfGenerator = new PDFReportGenerator();
const donationRepository = new DonationRepository();

export const generateDonationReport = asyncHandler(async (req, res) => {
  try {
    const filters = req.query;
    
    // Get donations based on filters
    const { donations } = await donationRepository.findAll(filters);
    
    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateDonationReport(
      donations || [],
      filters,
      process.env.ORG_NAME || 'Donation Management System'
    );
    
    // Set headers for PDF download
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

export const generateAnalyticsReport = asyncHandler(async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    // Get analytics data
    const analytics = await donationRepository.getAnalytics(timeframe || 'month');
    
    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateAnalyticsReport(
      analytics,
      timeframe,
      process.env.ORG_NAME || 'Donation Management System'
    );
    
    // Set headers for PDF download
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