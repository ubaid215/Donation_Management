// features/donations/services.js
import prisma from '../../config/prisma.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { sendWhatsAppNotificationWithRetry } from '../../utils/notification.js';
import { sendDonationReceipt } from '../../utils/email.js';

export class DonationService {
  constructor() {
    this.prisma = prisma;
  }

  async createDonation(donationData, operatorId, ipAddress = null) {
    // STEP 1: Send WhatsApp notification FIRST (before database commit)
    let whatsappResult = null;
    const useDonationConfirmation = donationData.sendWhatsApp !== false;

    if (donationData.donorPhone) {
      try {
        console.log('📱 Sending WhatsApp notification before database commit...');
        
        whatsappResult = await sendWhatsAppNotificationWithRetry({
          to: donationData.donorPhone,
          donorName: donationData.donorName,
          amount: donationData.amount.toString(),
          purpose: donationData.purpose,
          paymentMethod: donationData.paymentMethod,
          date: new Date(),
          sendDonationConfirmation: useDonationConfirmation
        });

        if (!whatsappResult.success && !whatsappResult.skipped) {
          // WhatsApp failed - throw error to prevent database commit
          throw whatsappResult;
        }

        console.log('✅ WhatsApp notification sent successfully, proceeding to database...');

      } catch (error) {
        console.error('❌ WhatsApp notification failed:', error);
        
        // Determine error type and message
        const errorMessage = error.error || error.message || 'Failed to send WhatsApp notification';
        const isPermanent = error.isPermanent || false;
        const canRetry = error.canRetry !== false; // Default to true if not specified

        // Throw a structured error that the frontend can understand
        const structuredError = new Error(errorMessage);
        structuredError.code = 'WHATSAPP_FAILED';
        structuredError.details = {
          message: errorMessage,
          isPermanent: isPermanent,
          canRetry: canRetry,
          errorCode: error.errorCode,
          errorType: error.errorType,
          attempts: error.attempts
        };
        
        throw structuredError;
      }
    } else {
      console.log('⚠️ No phone number provided - skipping WhatsApp notification');
    }

    // STEP 2: Only proceed with database commit if WhatsApp was successful or skipped
    const donation = await this.prisma.$transaction(async (tx) => {
      // Find or create category
      let categoryId = null;
      if (donationData.purpose) {
        let category = await tx.donationCategory.findFirst({
          where: {
            name: donationData.purpose,
            isActive: true
          }
        });

        if (!category) {
          category = await tx.donationCategory.create({
            data: {
              name: donationData.purpose,
              description: `Donations for ${donationData.purpose}`,
              isActive: true
            }
          });
        }
        categoryId = category.id;
      }

      const newDonation = await tx.donation.create({
        data: {
          donorName: donationData.donorName,
          donorPhone: donationData.donorPhone,
          donorEmail: donationData.donorEmail || null,
          amount: parseFloat(donationData.amount),
          purpose: donationData.purpose,
          categoryId: categoryId,
          paymentMethod: donationData.paymentMethod,
          notes: donationData.notes,
          operatorId: operatorId,
          date: new Date(),
          emailSent: false,
          emailSentAt: null,
          emailError: null,
          // Save WhatsApp status from the notification result
          whatsappSent: whatsappResult?.success || false,
          whatsappSentAt: whatsappResult?.success ? whatsappResult.timestamp : null,
          whatsappMessageId: whatsappResult?.messageId || null,
          whatsappError: null
        },
        include: {
          operator: {
            select: {
              name: true,
              email: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Log the donation creation
      await createAuditLog({
        action: 'DONATION_CREATED',
        userId: operatorId,
        userRole: 'OPERATOR',
        entityType: 'DONATION',
        entityId: newDonation.id,
        description: `Donation of Rs${donationData.amount} created for ${donationData.donorName}`,
        metadata: {
          amount: donationData.amount,
          purpose: donationData.purpose,
          categoryId: categoryId,
          paymentMethod: donationData.paymentMethod,
          donorName: donationData.donorName,
          donorPhone: donationData.donorPhone,
          donorEmail: donationData.donorEmail || null,
          sendWhatsApp: donationData.sendWhatsApp !== undefined ? donationData.sendWhatsApp : true
        },
        ipAddress: ipAddress
      });

      // Log WhatsApp success
      if (whatsappResult?.success) {
        await createAuditLog({
          action: 'WHATSAPP_SENT',
          userId: operatorId,
          userRole: 'OPERATOR',
          entityType: 'DONATION',
          entityId: newDonation.id,
          description: `WhatsApp notification sent to ${donationData.donorPhone}`,
          metadata: {
            recipient: donationData.donorPhone,
            donorName: donationData.donorName,
            amount: donationData.amount.toString(),
            purpose: donationData.purpose,
            messageId: whatsappResult.messageId,
            templateUsed: whatsappResult.templateUsed,
            templateType: whatsappResult.templateType,
            timestamp: whatsappResult.timestamp,
            attempt: whatsappResult.attempt
          }
        });
      }

      return newDonation;
    });

    // STEP 3: Send email receipt asynchronously (non-blocking)
    if (donation.donorEmail) {
      this.sendReceiptEmailAsync(donation.id, operatorId, ipAddress);
    }

    return donation;
  }

  // Send receipt email (main method)
  async sendReceiptEmail(donationId, userId, ipAddress = null, customMessage = '') {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id: donationId },
        include: {
          operator: {
            select: {
              name: true,
              email: true
            }
          },
          category: {
            select: {
              name: true
            }
          }
        }
      });

      if (!donation) {
        throw new Error('Donation not found');
      }

      if (!donation.donorEmail) {
        throw new Error('No email address provided for this donor');
      }

      // Send the email
      const emailResult = await sendDonationReceipt({
        to: donation.donorEmail,
        donationData: {
          id: donation.id,
          donorName: donation.donorName,
          amount: parseFloat(donation.amount.toString()),
          purpose: donation.purpose,
          paymentMethod: donation.paymentMethod,
          date: donation.date,
          receiptNumber: donation.receiptNumber || donation.id.substring(0, 8).toUpperCase()
        },
        customMessage
      });

      // Update donation record
      await this.prisma.donation.update({
        where: { id: donationId },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
          emailError: null
        }
      });

      // Create audit log
      await createAuditLog({
        action: 'EMAIL_SENT',
        userId: userId,
        userRole: 'ADMIN',
        entityType: 'DONATION',
        entityId: donationId,
        description: `Receipt email sent to ${donation.donorEmail}`,
        metadata: {
          recipient: donation.donorEmail,
          donorName: donation.donorName,
          amount: donation.amount,
          messageId: emailResult.messageId,
          customMessage: customMessage || null
        },
        ipAddress
      });

      return {
        success: true,
        emailSent: true,
        recipient: donation.donorEmail,
        messageId: emailResult.messageId,
        timestamp: emailResult.timestamp
      };
    } catch (error) {
      // Log the error in the database
      await this.prisma.donation.update({
        where: { id: donationId },
        data: {
          emailSent: false,
          emailError: error.message
        }
      }).catch(err => console.error('Failed to update email error:', err));

      // Create audit log for failure
      await createAuditLog({
        action: 'EMAIL_FAILED',
        userId: userId,
        userRole: 'ADMIN',
        entityType: 'DONATION',
        entityId: donationId,
        description: `Failed to send receipt email: ${error.message}`,
        metadata: {
          error: error.message,
          stack: error.stack
        },
        ipAddress
      }).catch(err => console.error('Failed to create audit log:', err));
      throw error;
    }
  }


  async updateDonation(donationId, updateData, userId, userRole, ipAddress = null) {
    return await this.prisma.$transaction(async (tx) => {
      // First, get the existing donation
      const existingDonation = await tx.donation.findUnique({
        where: { id: donationId },
        include: {
          operator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!existingDonation) {
        throw new Error('Donation not found');
      }

      // Check permissions
      if (userRole === 'OPERATOR' && existingDonation.operatorId !== userId) {
        throw new Error('You can only update your own donations');
      }

      // Check if donation is soft deleted
      if (existingDonation.isDeleted) {
        throw new Error('Cannot update a deleted donation. Restore it first.');
      }

      // Prepare update data
      const updatePayload = {};

      // Handle category if purpose is being updated
      if (updateData.purpose && updateData.purpose !== existingDonation.purpose) {
        let categoryId = null;
        let category = await tx.donationCategory.findFirst({
          where: {
            name: updateData.purpose,
            isActive: true
          }
        });

        if (!category) {
          category = await tx.donationCategory.create({
            data: {
              name: updateData.purpose,
              description: `Donations for ${updateData.purpose}`,
              isActive: true
            }
          });
        }
        categoryId = category.id;
        updatePayload.categoryId = categoryId;
        updatePayload.purpose = updateData.purpose;
      }

      // Handle other fields
      if (updateData.donorName !== undefined) {
        updatePayload.donorName = updateData.donorName;
      }

      if (updateData.donorPhone !== undefined) {
        updatePayload.donorPhone = updateData.donorPhone;
        // Reset WhatsApp status if phone is changed
        if (updateData.donorPhone !== existingDonation.donorPhone) {
          updatePayload.whatsappSent = false;
          updatePayload.whatsappSentAt = null;
          updatePayload.whatsappMessageId = null;
          updatePayload.whatsappError = null;
        }
      }

      if (updateData.donorEmail !== undefined) {
        updatePayload.donorEmail = updateData.donorEmail;
        // Reset email status if email is changed
        if (updateData.donorEmail !== existingDonation.donorEmail) {
          updatePayload.emailSent = false;
          updatePayload.emailSentAt = null;
          updatePayload.emailError = null;
        }
      }

      if (updateData.amount !== undefined) {
        updatePayload.amount = parseFloat(updateData.amount);
      }

      if (updateData.paymentMethod !== undefined) {
        updatePayload.paymentMethod = updateData.paymentMethod;
      }

      if (updateData.notes !== undefined) {
        updatePayload.notes = updateData.notes;
      }

      if (updateData.receiptNumber !== undefined) {
        updatePayload.receiptNumber = updateData.receiptNumber;
      }

      // If no changes, return existing donation
      if (Object.keys(updatePayload).length === 0) {
        return existingDonation;
      }

      // Update the donation
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: updatePayload,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Log the update action
      await createAuditLog({
        action: 'DONATION_UPDATED',
        userId: userId,
        userRole: userRole,
        entityType: 'DONATION',
        entityId: donationId,
        description: `Donation updated for ${updatedDonation.donorName}`,
        metadata: {
          previousValues: {
            donorName: existingDonation.donorName,
            donorPhone: existingDonation.donorPhone,
            donorEmail: existingDonation.donorEmail,
            amount: existingDonation.amount,
            purpose: existingDonation.purpose,
            paymentMethod: existingDonation.paymentMethod,
            notes: existingDonation.notes,
            receiptNumber: existingDonation.receiptNumber
          },
          newValues: updatePayload,
          updatedBy: userRole === 'ADMIN' ? 'Admin' : existingDonation.operator.name,
          operatorId: existingDonation.operatorId
        },
        ipAddress: ipAddress
      });

      // Send email notification if email was added and not previously sent
      if (updateData.donorEmail &&
        (!existingDonation.emailSent || updateData.donorEmail !== existingDonation.donorEmail)) {
        this.sendReceiptEmailAsync(donationId, userId, ipAddress);
      }

      return updatedDonation;
    });
  }


  async getDonationHistory(donationId, userId, userRole) {
    // First, check if donation exists and user has permission
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      select: { operatorId: true }
    });

    if (!donation) {
      throw new Error('Donation not found');
    }

    // Check permissions
    if (userRole === 'OPERATOR' && donation.operatorId !== userId) {
      throw new Error('Access denied');
    }

    // Get audit logs for this donation
    const history = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'DONATION',
        entityId: donationId,
        action: {
          in: ['DONATION_CREATED', 'DONATION_UPDATED', 'EMAIL_SENT', 'EMAIL_RESENT', 'EMAIL_FAILED', 'WHATSAPP_SENT', 'WHATSAPP_FAILED']
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        description: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return history;
  }

  // Async email sending (non-blocking for donation creation)
  async sendReceiptEmailAsync(donationId, userId, ipAddress = null) {
    try {
      await this.sendReceiptEmail(donationId, userId, ipAddress);
    } catch (error) {
      console.error('Async email sending failed:', error);
      // Don't throw - this is a background operation
    }
  }

  // Resend receipt email
  async resendReceiptEmail(donationId, userId, ipAddress = null, customMessage = '') {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id: donationId },
        include: {
          operator: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (!donation) {
        throw new Error('Donation not found');
      }

      if (!donation.donorEmail) {
        throw new Error('No email address provided for this donor');
      }

      const emailResult = await sendDonationReceipt({
        to: donation.donorEmail,
        donationData: {
          id: donation.id,
          donorName: donation.donorName,
          amount: parseFloat(donation.amount.toString()),
          purpose: donation.purpose,
          paymentMethod: donation.paymentMethod,
          date: donation.date,
          receiptNumber: donation.receiptNumber || donation.id.substring(0, 8).toUpperCase()
        },
        customMessage
      });

      await this.prisma.donation.update({
        where: { id: donationId },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
          emailError: null
        }
      });

      await createAuditLog({
        action: 'EMAIL_RESENT',
        userId: userId,
        userRole: 'ADMIN',
        entityType: 'DONATION',
        entityId: donationId,
        description: `Receipt email re-sent to ${donation.donorEmail}`,
        metadata: {
          recipient: donation.donorEmail,
          donorName: donation.donorName,
          messageId: emailResult.messageId,
          customMessage: customMessage || null
        },
        ipAddress
      });

      return {
        success: true,
        emailSent: true,
        recipient: donation.donorEmail,
        messageId: emailResult.messageId,
        timestamp: emailResult.timestamp
      };
    } catch (error) {
      await this.prisma.donation.update({
        where: { id: donationId },
        data: {
          emailError: error.message
        }
      }).catch(err => console.error('Failed to update email error:', err));

      throw error;
    }
  }


  async getDonation(donationId, user) {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!donation) {
      throw new Error('Donation not found');
    }

    // Operators can only view their own donations
    if (user.role === 'OPERATOR' && donation.operatorId !== user.id) {
      throw new Error('Access denied');
    }

    return donation;
  }

  // Search donors by name or phone
  async searchDonors(searchQuery, limit = 10) {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const search = searchQuery.trim();

    const donors = await this.prisma.donation.groupBy({
      by: ['donorPhone', 'donorName'],
      where: {
        isDeleted: false,
        OR: [
          { donorName: { contains: search, mode: 'insensitive' } },
          { donorPhone: { contains: search, mode: 'insensitive' } }
        ]
      },
      _count: true,
      _sum: { amount: true },
      _max: { date: true },
      orderBy: {
        _max: { date: 'desc' }
      },
      take: limit
    });

    return donors.map(donor => ({
      donorName: donor.donorName,
      donorPhone: donor.donorPhone,
      totalDonations: donor._count,
      totalAmount: donor._sum.amount ? parseFloat(donor._sum.amount.toString()) : 0,
      lastDonationDate: donor._max.date
    }));
  }

  // Get donor details by phone number
  async getDonorByPhone(phone) {
    if (!phone || phone.trim().length === 0) {
      return null;
    }

    const latestDonation = await this.prisma.donation.findFirst({
      where: {
        donorPhone: phone.trim(),
        isDeleted: false
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        donorName: true,
        donorPhone: true,
        donorEmail: true,
        purpose: true,
        paymentMethod: true
      }
    });

    if (!latestDonation) {
      return null;
    }

    const [donationCount, totalAmount, donations] = await Promise.all([
      this.prisma.donation.count({
        where: { 
          donorPhone: phone.trim(),
          isDeleted: false
        }
      }),
      this.prisma.donation.aggregate({
        where: { 
          donorPhone: phone.trim(),
          isDeleted: false
        },
        _sum: { amount: true }
      }),
      this.prisma.donation.findMany({
        where: { 
          donorPhone: phone.trim(),
          isDeleted: false
        },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          purpose: true,
          paymentMethod: true,
          date: true
        }
      })
    ]);

    return {
      donorName: latestDonation.donorName,
      donorPhone: latestDonation.donorPhone,
      donorEmail: latestDonation.donorEmail,
      lastPurpose: latestDonation.purpose,
      lastPaymentMethod: latestDonation.paymentMethod,
      totalDonations: donationCount,
      totalAmount: totalAmount._sum.amount ? parseFloat(totalAmount._sum.amount.toString()) : 0,
      recentDonations: donations.map(d => ({
        id: d.id,
        amount: parseFloat(d.amount.toString()),
        purpose: d.purpose,
        paymentMethod: d.paymentMethod,
        date: d.date
      }))
    };
  }

  // Get donor suggestions (autocomplete)
  async getDonorSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const search = query.trim();

    const suggestions = await this.prisma.donation.groupBy({
      by: ['donorPhone', 'donorName'],
      where: {
        isDeleted: false,
        OR: [
          { donorName: { contains: search, mode: 'insensitive' } },
          { donorPhone: { contains: search, mode: 'insensitive' } }
        ]
      },
      _max: { date: true },
      orderBy: {
        _max: { date: 'desc' }
      },
      take: limit
    });

    return suggestions.map(s => ({
      donorName: s.donorName,
      donorPhone: s.donorPhone,
      lastDonationDate: s._max.date
    }));
  }

  async getOperatorDonations(operatorId, filters = {}) {
    const {
      startDate,
      endDate,
      purpose,
      paymentMethod,
      page = 1,
      limit = 20
    } = filters;

    const where = {
      operatorId,
      isDeleted: false,
      ...(startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      },
      ...(purpose && { purpose: { contains: purpose, mode: 'insensitive' } }),
      ...(paymentMethod && { paymentMethod })
    };

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          donorName: true,
          donorPhone: true,
          donorEmail: true,
          amount: true,
          purpose: true,
          paymentMethod: true,
          date: true,
          notes: true,
          emailSent: true,
          emailSentAt: true,
          whatsappSent: true,
          whatsappSentAt: true
        }
      }),
      this.prisma.donation.count({ where })
    ]);

    return {
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAdminDonations(filters = {}) {
    const {
      operatorId,
      startDate,
      endDate,
      purpose,
      paymentMethod,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 50
    } = filters;

    const where = {
      isDeleted: false,
      ...(operatorId && { operatorId }),
      ...(startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      },
      ...(purpose && { purpose: { contains: purpose, mode: 'insensitive' } }),
      ...(paymentMethod && { paymentMethod }),
      ...(minAmount || maxAmount) && {
        amount: {
          ...(minAmount && { gte: parseFloat(minAmount) }),
          ...(maxAmount && { lte: parseFloat(maxAmount) })
        }
      },
      ...(search && {
        OR: [
          { donorName: { contains: search, mode: 'insensitive' } },
          { donorPhone: { contains: search, mode: 'insensitive' } },
          { donorEmail: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      this.prisma.donation.count({ where })
    ]);

    return {
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getDonationAnalytics(timeframe = 'month') {
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const [
      totalDonations,
      totalAmount,
      todayDonations,
      monthlyDonations,
      donationsByDay,
      donationsByPurpose,
      donationsByOperator,
      topDonors
    ] = await Promise.all([
      this.prisma.donation.count({
        where: { isDeleted: false }
      }),
      this.prisma.donation.aggregate({
        where: { isDeleted: false },
        _sum: { amount: true }
      }),
      this.prisma.donation.aggregate({
        where: {
          isDeleted: false,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { amount: true },
        _count: true
      }),
      this.prisma.donation.aggregate({
        where: {
          isDeleted: false,
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        },
        _sum: { amount: true },
        _count: true
      }),
      this.getDonationsByDay(startDate),
      this.getDonationsByPurpose(startDate),
      this.getDonationsByOperator(startDate),
      this.getTopDonors()
    ]);

    return {
      metrics: {
        totalDonations,
        totalAmount: totalAmount._sum.amount || 0,
        todayCount: todayDonations._count,
        todayAmount: todayDonations._sum.amount || 0,
        monthlyCount: monthlyDonations._count,
        monthlyAmount: monthlyDonations._sum.amount || 0,
        activeOperators: await this.getActiveOperatorsCount()
      },
      charts: {
        byDay: donationsByDay,
        byPurpose: donationsByPurpose,
        byOperator: donationsByOperator
      },
      topDonors
    };
  }

  async getDonationsByDay(startDate) {
    const donations = await this.prisma.$queryRaw`
    SELECT 
      DATE(date) as day,
      COUNT(*)::int as count,
      COALESCE(SUM(amount), 0)::float as total_amount
    FROM donations
    WHERE date >= ${startDate}
      AND "isDeleted" = false
    GROUP BY DATE(date)
    ORDER BY day DESC
    LIMIT 30
  `;

    return donations.map(row => ({
      day: row.day,
      count: Number(row.count),
      total_amount: Number(row.total_amount)
    }));
  }

  async getDonationsByPurpose(startDate) {
    const categories = await this.prisma.donationCategory.findMany({
      where: { isActive: true },
      include: {
        donations: {
          where: {
            date: { gte: startDate },
            isDeleted: false
          },
          select: {
            amount: true
          }
        }
      }
    });

    const categoryStats = categories
      .map(cat => {
        const totalAmount = cat.donations.reduce((sum, donation) =>
          sum + parseFloat(donation.amount.toString()), 0
        );
        const count = cat.donations.length;

        return {
          purpose: cat.name,
          count: count,
          amount: totalAmount
        };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const uncategorizedDonations = await this.prisma.donation.groupBy({
      by: ['purpose'],
      where: {
        date: { gte: startDate },
        categoryId: null,
        isDeleted: false
      },
      _count: true,
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' }
      },
      take: 5
    });

    const uncategorizedStats = uncategorizedDonations.map(item => ({
      purpose: item.purpose,
      count: item._count,
      amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0
    }));

    return [...categoryStats, ...uncategorizedStats].slice(0, 10);
  }

  async getDonationsByOperator(startDate) {
    const donations = await this.prisma.donation.groupBy({
      by: ['operatorId'],
      where: {
        date: { gte: startDate },
        isDeleted: false
      },
      _count: true,
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' }
      }
    });

    const operatorIds = donations.map(d => d.operatorId);
    const operators = await this.prisma.user.findMany({
      where: { id: { in: operatorIds } },
      select: { id: true, name: true }
    });

    const operatorMap = new Map(operators.map(op => [op.id, op.name]));

    return donations.map(item => ({
      operatorId: item.operatorId,
      operatorName: operatorMap.get(item.operatorId) || 'Unknown',
      count: item._count,
      amount: item._sum.amount || 0
    }));
  }

  async getTopDonors(limit = 5) {
    const donors = await this.prisma.donation.groupBy({
      by: ['donorPhone', 'donorName'],
      where: { isDeleted: false },
      _count: true,
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' }
      },
      take: limit
    });

    return donors.map(donor => ({
      phone: donor.donorPhone,
      name: donor.donorName,
      donationCount: donor._count,
      totalAmount: donor._sum.amount || 0
    }));
  }

  async getActiveOperatorsCount(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.prisma.user.count({
      where: {
        role: 'OPERATOR',
        isActive: true,
        lastLogin: { gte: cutoffDate }
      }
    });
  }
}