import prisma from '../../config/prisma.js';
import { createAuditLog } from '../../utils/auditLogger.js';

// Helper function to convert BigInt to string for JSON serialization
const convertBigInt = (value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(convertBigInt);
  }
  if (value !== null && typeof value === 'object') {
    const newObj = {};
    for (const key in value) {
      newObj[key] = convertBigInt(value[key]);
    }
    return newObj;
  }
  return value;
};

export class AdminService {
  constructor() {
    this.prisma = prisma;
  }

  async getSystemStats() {
    const [
      totalDonations,
      totalAmount,
      totalOperators,
      activeOperators,
      todayDonations,
      weekDonations,
      monthDonations
    ] = await Promise.all([
      this.prisma.donation.count(),
      
      this.prisma.donation.aggregate({
        _sum: { amount: true }
      }),
      
      this.prisma.user.count({
        where: { role: 'OPERATOR' }
      }),
      
      this.prisma.user.count({
        where: { 
          role: 'OPERATOR',
          isActive: true,
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      this.prisma.donation.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      this.prisma.donation.count({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      this.prisma.donation.count({
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const result = {
      totals: {
        donations: totalDonations,
        amount: totalAmount._sum.amount || 0,
        operators: totalOperators
      },
      activity: {
        activeOperators,
        todayDonations,
        weekDonations,
        monthDonations
      }
    };

    return convertBigInt(result);
  }

  async getDonationInsights(timeframe = 'month') {
    let startDate;
    const now = new Date();

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      totalAmount,
      donationCount,
      avgDonation,
      maxDonation,
      minDonation,
      purposeDistribution,
      paymentMethodDistribution,
      hourlyDistribution
    ] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { date: { gte: startDate } },
        _sum: { amount: true }
      }),
      
      this.prisma.donation.count({
        where: { date: { gte: startDate } }
      }),
      
      this.prisma.donation.aggregate({
        where: { date: { gte: startDate } },
        _avg: { amount: true }
      }),
      
      this.prisma.donation.aggregate({
        where: { date: { gte: startDate } },
        _max: { amount: true }
      }),
      
      this.prisma.donation.aggregate({
        where: { date: { gte: startDate } },
        _min: { amount: true }
      }),
      
      this.prisma.donation.groupBy({
        by: ['purpose'],
        where: { date: { gte: startDate } },
        _count: true,
        _sum: { amount: true },
        orderBy: {
          _sum: { amount: 'desc' }
        },
        take: 5
      }),
      
      this.prisma.donation.groupBy({
        by: ['paymentMethod'],
        where: { date: { gte: startDate } },
        _count: true,
        _sum: { amount: true }
      }),
      
      this.prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM date) as hour,
          COUNT(*) as donation_count,
          SUM(amount) as total_amount
        FROM donations
        WHERE date >= NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(HOUR FROM date)
        ORDER BY hour
      `
    ]);

    const safeHourlyDistribution = Array.isArray(hourlyDistribution) 
      ? hourlyDistribution.map(row => ({
          hour: Number(row.hour),
          donation_count: Number(row.donation_count),
          total_amount: row.total_amount ? parseFloat(row.total_amount.toString()) : 0
        }))
      : [];

    const result = {
      overview: {
        totalAmount: totalAmount._sum.amount ? parseFloat(totalAmount._sum.amount.toString()) : 0,
        donationCount,
        avgDonation: avgDonation._avg.amount ? parseFloat(avgDonation._avg.amount.toString()) : 0,
        maxDonation: maxDonation._max.amount ? parseFloat(maxDonation._max.amount.toString()) : 0,
        minDonation: minDonation._min.amount ? parseFloat(minDonation._min.amount.toString()) : 0
      },
      distribution: {
        byPurpose: purposeDistribution.map(item => ({
          purpose: item.purpose,
          count: item._count,
          amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0
        })),
        byPaymentMethod: paymentMethodDistribution.map(item => ({
          method: item.paymentMethod,
          count: item._count,
          amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0
        })),
        byHour: safeHourlyDistribution
      }
    };

    return convertBigInt(result);
  }

  async exportData(exportType, filters = {}) {
    let data;
    
    switch (exportType) {
      case 'donations':
        data = await this.getAllDonationsForExport(filters);
        break;
      case 'audit':
        data = await this.getAllAuditLogsForExport(filters);
        break;
      case 'operators':
        data = await this.getAllOperatorsForExport(filters);
        break;
      default:
        throw new Error('Invalid export type');
    }

    await createAuditLog({
      action: 'DATA_EXPORTED',
      userId: filters.adminId,
      userRole: 'ADMIN',
      entityType: exportType.toUpperCase(),
      description: `${exportType} data exported`,
      metadata: {
        filters,
        recordCount: data.length
      }
    });

    return data;
  }

  async getAllDonationsForExport(filters) {
    const where = this.buildDonationWhereClause(filters);
    
    return await this.prisma.donation.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        operator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  }

  async getAllAuditLogsForExport(filters) {
    const { startDate, endDate } = filters;
    
    const where = {
      ...(startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };
    
    return await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  async getAllOperatorsForExport(filters) {
    const { isActive } = filters;
    
    const where = {
      role: 'OPERATOR',
      ...(isActive !== undefined && { isActive })
    };
    
    return await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            donations: true
          }
        }
      }
    });
  }

  buildDonationWhereClause(filters) {
    const {
      startDate,
      endDate,
      operatorId,
      purpose,
      paymentMethod,
      minAmount,
      maxAmount
    } = filters;

    return {
      ...(startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      },
      ...(operatorId && { operatorId }),
      ...(purpose && { purpose: { contains: purpose, mode: 'insensitive' } }),
      ...(paymentMethod && { paymentMethod }),
      ...(minAmount || maxAmount) && {
        amount: {
          ...(minAmount && { gte: parseFloat(minAmount) }),
          ...(maxAmount && { lte: parseFloat(maxAmount) })
        }
      }
    };
  }

}