import asyncHandler from 'express-async-handler';
import { DonationService } from './service.js';

const donationService = new DonationService();

export const createDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.createDonation(req.body, req.user.id);
  
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
  // Fixed: Call the correct method name from the service
  const analytics = await donationService.getDonationAnalytics(req.query.timeframe);
  
  res.json({
    success: true,
    data: analytics  // Changed from 'analytics' to 'data' for consistency
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