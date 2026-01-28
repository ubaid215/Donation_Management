import asyncHandler from 'express-async-handler';
import { DonationService } from './service.js';
import { createAuditLog } from '../../utils/auditLogger.js';


const donationService = new DonationService();

export const createDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.createDonation(req.body, req.user.id, req.ip);
  
  res.status(201).json({
    success: true,
    message: 'Donation recorded successfully',
    donation
  });
});


export const updateDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const updatedDonation = await donationService.updateDonation(
    id,
    req.body,
    req.user.id,
    req.user.role,
    req.ip
  );
  
  res.json({
    success: true,
    message: 'Donation updated successfully',
    donation: updatedDonation
  });
});

export const getDonationHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const history = await donationService.getDonationHistory(
    id,
    req.user.id,
    req.user.role
  );
  
  res.json({
    success: true,
    history
  });
});


export const softDeleteDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  // First, check if donation exists
  const donation = await prisma.donation.findUnique({
    where: { id }
  });

  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  // Check if already deleted
  if (donation.isDeleted) {
    return res.status(400).json({
      success: false,
      error: 'Donation is already deleted'
    });
  }

  // Check permissions - only admins can delete
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Only admins can delete donations'
    });
  }

  // Soft delete by marking as deleted
  const deletedDonation = await prisma.donation.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user.id,
      deletionReason: reason || 'No reason provided'
    }
  });

  // Create audit log
  await createAuditLog({
    action: 'DONATION_DELETED',
    userId: req.user.id,
    userRole: 'ADMIN',
    entityType: 'DONATION',
    entityId: id,
    description: `Donation soft deleted for ${donation.donorName}`,
    metadata: {
      donorName: donation.donorName,
      amount: donation.amount,
      purpose: donation.purpose,
      reason: reason || 'No reason provided',
      deletedBy: req.user.name,
      operatorId: donation.operatorId
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Donation deleted successfully',
    donation: {
      id: deletedDonation.id,
      donorName: deletedDonation.donorName,
      amount: deletedDonation.amount,
      purpose: deletedDonation.purpose,
      isDeleted: deletedDonation.isDeleted,
      deletedAt: deletedDonation.deletedAt,
      deletionReason: deletedDonation.deletionReason
    }
  });
});

export const restoreDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  // First, check if donation exists
  const donation = await prisma.donation.findUnique({
    where: { id }
  });

  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  if (!donation.isDeleted) {
    return res.status(400).json({
      success: false,
      error: 'Donation is not deleted'
    });
  }

  // Check permissions - only admins can restore
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Only admins can restore donations'
    });
  }

  // Restore the donation
  const restoredDonation = await prisma.donation.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null
    }
  });

  // Create audit log
  await createAuditLog({
    action: 'DONATION_RESTORED',
    userId: req.user.id,
    userRole: 'ADMIN',
    entityType: 'DONATION',
    entityId: id,
    description: `Donation restored for ${donation.donorName}`,
    metadata: {
      donorName: donation.donorName,
      amount: donation.amount,
      purpose: donation.purpose,
      reason: reason || 'No reason provided',
      restoredBy: req.user.name,
      operatorId: donation.operatorId
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Donation restored successfully',
    donation: {
      id: restoredDonation.id,
      donorName: restoredDonation.donorName,
      amount: restoredDonation.amount,
      purpose: restoredDonation.purpose,
      isDeleted: restoredDonation.isDeleted
    }
  });
});

// Add this function to get deleted donations
export const getDeletedDonations = asyncHandler(async (req, res) => {
  // Only admins can view deleted donations
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Only admins can view deleted donations'
    });
  }

  const {
    startDate,
    endDate,
    operatorId,
    search,
    page = 1,
    limit = 50
  } = req.query;

  const where = {
    isDeleted: true,
    ...(startDate || endDate) && {
      deletedAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    },
    ...(operatorId && { operatorId }),
    ...(search && {
      OR: [
        { donorName: { contains: search, mode: 'insensitive' } },
        { donorPhone: { contains: search, mode: 'insensitive' } },
        { donorEmail: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [donations, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        deletedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.donation.count({ where })
  ]);

  res.json({
    success: true,
    donations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
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