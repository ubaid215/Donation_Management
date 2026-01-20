import prisma from '../../config/prisma.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { sendEmailNotification, sendWhatsAppNotification } from '../../utils/notification.js';

export class DonationService {
  constructor() {
    this.prisma = prisma;
  }

async createDonation(donationData, operatorId, ipAddress = null) {
  const donation = await this.prisma.$transaction(async (tx) => {
    const newDonation = await tx.donation.create({
      data: {
        ...donationData,
        operatorId,
        date: new Date()
      },
      include: {
        operator: {
          select: {
            name: true,
            email: true
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
        paymentMethod: donationData.paymentMethod,
        donorName: donationData.donorName,
        donorPhone: donationData.donorPhone
      },
      ipAddress: ipAddress // Add IP from request
    });

    return newDonation;
  });

  this.sendDonationNotifications(donation);
  return donation;
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
    let startDate = new Date(); // Fixed: create new instance

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
      // Total donations count
      this.prisma.donation.count(),
      
      // Total amount
      this.prisma.donation.aggregate({
        _sum: { amount: true }
      }),
      
      // Today's donations
      this.prisma.donation.aggregate({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Monthly donations (last 30 days)
      this.prisma.donation.aggregate({
        where: {
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Donations per day (last 30 days)
      this.getDonationsByDay(startDate),
      
      // Donations by purpose
      this.getDonationsByPurpose(startDate),
      
      // Donations by operator
      this.getDonationsByOperator(startDate),
      
      // Top donors
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
  
  // Convert BigInt to Number and format the response
  return donations.map(row => ({
    day: row.day,
    count: Number(row.count), // Convert BigInt to Number
    total_amount: Number(row.total_amount) // Change to snake_case
  }));
}

  async getDonationsByPurpose(startDate) {
    const donations = await this.prisma.donation.groupBy({
      by: ['purpose'],
      where: {
        date: { gte: startDate }
      },
      _count: true,
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' }
      },
      take: 10
    });
    
    return donations.map(item => ({
      purpose: item.purpose,
      count: item._count,
      amount: item._sum.amount || 0
    }));
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
    
    // Fetch operator names
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

  async getTopDonors(limit = 10) {
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
      // Email notification to admin
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

      // WhatsApp notification to donor
      if (donation.donorPhone) {
        await sendWhatsAppNotification({
          to: donation.donorPhone,
          message: `Thank you for your donation of Rs ${donation.amount} for ${donation.purpose}. Your contribution is greatly appreciated.`
        });
      }
    } catch (error) {
      console.error('Notification sending failed:', error);
      // Don't fail the donation creation if notifications fail
    }
  }
}