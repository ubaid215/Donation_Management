import asyncHandler from 'express-async-handler';
import { DonationService } from './service.js';

const donationService = new DonationService();

export const createDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.createDonation(req.body, req.user.id, req.ip);
  
  res.status(201).json({
    success: true,
    message: 'Donation recorded successfully',
    donation
  });
});

export const getMyDonations = asyncHandler(async (req, res) => {
  const result = await donationService.getOperatorDonations(req.user.id, req.query);
  
  res.json({
    success: true,
    ...result
  });
});

export const getDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.getDonation(req.params.id, req.user);
  
  res.json({
    success: true,
    donation
  });
});

export const getAllDonations = asyncHandler(async (req, res) => {
  const result = await donationService.getAdminDonations(req.query);
  
  res.json({
    success: true,
    ...result
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await donationService.getDonationAnalytics(req.query.timeframe);
  
  res.json({
    success: true,
    data: analytics
  });
});

export const getTopDonors = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const donors = await donationService.getTopDonors(limit);
  
  res.json({
    success: true,
    donors
  });
});

// NEW ENDPOINTS FOR DONOR SEARCH

export const searchDonors = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters'
    });
  }

  const donors = await donationService.searchDonors(q, parseInt(limit) || 10);

  res.json({
    success: true,
    donors
  });
});

export const getDonorByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required'
    });
  }

  const donor = await donationService.getDonorByPhone(phone);

  if (!donor) {
    return res.status(404).json({
      success: false,
      error: 'Donor not found'
    });
  }

  res.json({
    success: true,
    donor
  });
});


export const sendDonationReceiptEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customMessage } = req.body;

  const result = await donationService.sendReceiptEmail(
    id,
    req.user.id,
    req.ip,
    customMessage
  );

  res.json({
    success: true,
    message: 'Receipt email sent successfully',
    ...result
  });
});

export const resendDonationReceiptEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customMessage } = req.body;

  const result = await donationService.resendReceiptEmail(
    id,
    req.user.id,
    req.ip,
    customMessage
  );

  res.json({
    success: true,
    message: 'Receipt email re-sent successfully',
    ...result
  });
});

export const getDonationEmailStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: {
      id: true,
      donorName: true,
      donorEmail: true,
      emailSent: true,
      emailSentAt: true,
      emailError: true,
      amount: true,
      purpose: true
    }
  });

  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  res.json({
    success: true,
    emailStatus: {
      sent: donation.emailSent,
      sentAt: donation.emailSentAt,
      recipient: donation.donorEmail,
      recipientName: donation.donorName,
      error: donation.emailError,
      lastUpdated: donation.emailSentAt || donation.updatedAt
    }
  });
});

export const getDonorSuggestions = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({
      success: true,
      suggestions: []
    });
  }

  const suggestions = await donationService.getDonorSuggestions(
    q,
    parseInt(limit) || 5
  );

  res.json({
    success: true,
    suggestions
  });
});