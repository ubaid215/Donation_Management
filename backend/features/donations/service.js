import prisma from '../../config/prisma.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { sendEmailNotification, sendWhatsAppNotification } from '../../utils/notification.js';

export class DonationService {
  constructor() {
    this.prisma = prisma;
  }

  async createDonation(donationData, operatorId, ipAddress = null) {
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
          // Create category if it doesn't exist
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
          amount: parseFloat(donationData.amount),
          purpose: donationData.purpose,
          categoryId: categoryId,
          paymentMethod: donationData.paymentMethod,
          notes: donationData.notes,
          operatorId: operatorId,
          date: new Date()
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

      // Log the action
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
          donorPhone: donationData.donorPhone
        },
        ipAddress: ipAddress
      });

      return newDonation;
    });

    this.sendDonationNotifications(donation);
    return donation;
  }

  // NEW: Search donors by name or phone
  async searchDonors(searchQuery, limit = 10) {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const search = searchQuery.trim();

    // Get unique donors based on phone number or name
    const donors = await this.prisma.donation.groupBy({
      by: ['donorPhone', 'donorName'],
      where: {
        OR: [
          { donorName: { contains: search, mode: 'insensitive' } },
          { donorPhone: { contains: search, mode: 'insensitive' } }
        ]
      },
      _count: true,
      _sum: { amount: true },
      _max: { date: true },
      orderBy: {
        _max: { date: 'desc' } // Most recent donors first
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

  // NEW: Get donor details by phone number
  async getDonorByPhone(phone) {
    if (!phone || phone.trim().length === 0) {
      return null;
    }

    // Get the most recent donation for this phone number
    const latestDonation = await this.prisma.donation.findFirst({
      where: {
        donorPhone: phone.trim()
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        donorName: true,
        donorPhone: true,
        purpose: true,
        paymentMethod: true
      }
    });

    if (!latestDonation) {
      return null;
    }

    // Get donation history for this donor
    const [donationCount, totalAmount, donations] = await Promise.all([
      this.prisma.donation.count({
        where: { donorPhone: phone.trim() }
      }),
      this.prisma.donation.aggregate({
        where: { donorPhone: phone.trim() },
        _sum: { amount: true }
      }),
      this.prisma.donation.findMany({
        where: { donorPhone: phone.trim() },
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

  // NEW: Get donor suggestions (autocomplete)
  async getDonorSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const search = query.trim();

    // Get unique donor names and phones
    const suggestions = await this.prisma.donation.groupBy({
      by: ['donorPhone', 'donorName'],
      where: {
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
          amount: true,
          purpose: true,
          paymentMethod: true,
          date: true,
          notes: true
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
          { donorPhone: { contains: search, mode: 'insensitive' } }
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
      this.prisma.donation.count(),
      this.prisma.donation.aggregate({
        _sum: { amount: true }
      }),
      this.prisma.donation.aggregate({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { amount: true },
        _count: true
      }),
      this.prisma.donation.aggregate({
        where: {
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
            date: { gte: startDate }
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
        categoryId: null
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
        date: { gte: startDate }
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

  async sendDonationNotifications(donation) {
    try {
      if (process.env.ADMIN_EMAIL) {
        await sendEmailNotification({
          to: process.env.ADMIN_EMAIL,
          subject: `New Donation Received - ₹${donation.amount}`,
          html: `
            <h2>New Donation Received</h2>
            <p><strong>Donor:</strong> ${donation.donorName}</p>
            <p><strong>Amount:</strong> Rs ${donation.amount}</p>
            <p><strong>Purpose:</strong> ${donation.purpose}</p>
            <p><strong>Payment Method:</strong> ${donation.paymentMethod}</p>
            <p><strong>Operator:</strong> ${donation.operator.name}</p>
            <p><strong>Date:</strong> ${new Date(donation.date).toLocaleString()}</p>
          `
        });
      }

      if (donation.donorPhone) {
        await sendWhatsAppNotification({
          to: donation.donorPhone,
          message: `Thank you for your donation of Rs ${donation.amount} for ${donation.purpose}. Your contribution is greatly appreciated.`
        });
      }
    } catch (error) {
      console.error('Notification sending failed:', error);
    }
  }
}