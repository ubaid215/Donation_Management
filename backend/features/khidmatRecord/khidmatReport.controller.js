// ============================================================
// features/khidmatRecord/khidmatReport.controller.js
// PDF report endpoints for KhidmatRecord
// Mirrors the structure of reports.controller.js exactly.
// ============================================================

import asyncHandler from 'express-async-handler';
import { KhidmatPDFGenerator } from './khidmatPdfGenerator.js';
import prisma from '../../config/prisma.js';

const pdfGenerator = new KhidmatPDFGenerator();

// ─────────────────────────────────────────────
// Helper — fetch records from DB with filters
// Runs up to 10 000 rows (report mode, no pagination)
// ─────────────────────────────────────────────
const fetchRecordsForReport = async (filters = {}) => {
  const {
    status,
    categoryId,
    operatorId,
    startDate,
    endDate,
    search
  } = filters;

  const where = {
    isDeleted: false,
    ...(status     && { status }),
    ...(categoryId && { categoryId }),
    ...(operatorId && { operatorId }),
    ...(startDate || endDate) && {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate) })
      }
    },
    ...(search && {
      OR: [
        { name:    { contains: search, mode: 'insensitive' } },
        { phone:   { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  return prisma.khidmatRecord.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 10000,
    include: {
      category: { select: { id: true, name: true } },
      operator: { select: { id: true, name: true } }
    }
  });
};

// ─────────────────────────────────────────────
// GET /api/khidmat/reports/full
// Full khidmat report (all records, filterable)
// ─────────────────────────────────────────────
export const generateKhidmatReport = asyncHandler(async (req, res) => {
  try {
    const filters = req.query;
    const records = await fetchRecordsForReport(filters);

    const pdfBuffer = await pdfGenerator.generateKhidmatReport(
      records,
      filters,
      process.env.ORG_NAME || 'Donation Management Khanqah'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=khidmat-report-${new Date().toISOString().split('T')[0]}.pdf`
    );
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Khidmat report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate khidmat report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/khidmat/reports/category
// Per-category khidmat report
// Query params: categoryId (required) OR categoryName
// ─────────────────────────────────────────────
export const generateKhidmatCategoryReport = asyncHandler(async (req, res) => {
  try {
    const { categoryId, categoryName, ...restFilters } = req.query;

    if (!categoryId && !categoryName) {
      return res.status(400).json({
        success: false,
        message: 'categoryId or categoryName query parameter is required'
      });
    }

    const reportFilters = { ...restFilters };
    if (categoryId) reportFilters.categoryId = categoryId;

    const records = await fetchRecordsForReport(reportFilters);

    // Resolve display name
    let resolvedName = categoryName;
    if (!resolvedName && categoryId) {
      const cat = await prisma.donationCategory.findUnique({
        where: { id: categoryId },
        select: { name: true }
      });
      resolvedName = cat?.name || `Category ${categoryId}`;
    }

    const pdfBuffer = await pdfGenerator.generateKhidmatCategoryReport(
      records,
      resolvedName,
      { categoryName: resolvedName, ...restFilters },
      process.env.ORG_NAME || 'Donation Management Khanqah'
    );

    const safeName = resolvedName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=khidmat-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`
    );
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Khidmat category report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate khidmat category report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/khidmat/reports/receipt/:id
// Single-record receipt PDF
// ─────────────────────────────────────────────
export const generateKhidmatReceipt = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.khidmatRecord.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } }
      }
    });

    if (!record || record.isDeleted) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const pdfBuffer = await pdfGenerator.generateKhidmatReceipt(
      record,
      process.env.ORG_NAME || 'Donation Management Khanqah'
    );

    const safeName = record.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=khidmat-receipt-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`
    );
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Khidmat receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate khidmat receipt',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});