import prisma from '../../config/prisma.js';

export class DonationRepository {
  constructor() {
    this.prisma = prisma;
  }

  createDateFilter(startDate, endDate) {
    const filter = {};
    
    if (startDate) {
      // For start date, include from the beginning of the day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to 00:00:00.000
      filter.gte = start;
    }
    
    if (endDate) {
      // For end date, include until the end of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to 23:59:59.999
      filter.lte = end;
    }
    
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  async create(data) {
    return await this.prisma.donation.create({
      data,
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
  }

  async findById(id, operatorId = null) {
    const where = { id };
    if (operatorId) {
      where.operatorId = operatorId;
    }

    return await this.prisma.donation.findUnique({
      where,
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
  }

   async findByOperator(operatorId, filters = {}) {
    const { 
      startDate, 
      endDate, 
      purpose, 
      paymentMethod,
      page = 1,
      limit = 20
    } = filters;

    const where = {
      operatorId
    };

    // Fix date filtering
    const dateFilter = this.createDateFilter(startDate, endDate);
    if (dateFilter) {
      where.date = dateFilter;
    }

    // Add other filters
    if (purpose) {
      where.purpose = { contains: purpose, mode: 'insensitive' };
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

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
          notes: true,
          category: {
            select: {
              name: true
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

  async findAll(filters = {}) {
    const {
      operatorId,
      startDate,
      endDate,
      purpose,
      paymentMethod,
      minAmount,
      maxAmount,
      search,
      categoryId,
      page = 1,
      limit = 50
    } = filters;

    const where = {};

    // Fix date filtering
    const dateFilter = this.createDateFilter(startDate, endDate);
    if (dateFilter) {
      where.date = dateFilter;
    }

    // Add other filters
    if (operatorId) {
      where.operatorId = operatorId;
    }
    
    if (purpose) {
      where.purpose = { contains: purpose, mode: 'insensitive' };
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }
    
    if (search) {
      where.OR = [
        { donorName: { contains: search, mode: 'insensitive' } },
        { donorPhone: { contains: search, mode: 'insensitive' } }
      ];
    }

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
          },
          category: {
            select: {
              id: true,
              name: true
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


  async getAnalytics(timeframe = 'month') {
    const now = new Date();
    let startDate;

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

    return await this.prisma.$transaction(async (tx) => {
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
        tx.donation.count(),
        
        // Total amount
        tx.donation.aggregate({
          _sum: { amount: true }
        }),
        
        // Today's donations
        tx.donation.aggregate({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { amount: true },
          _count: true
        }),
        
        // Monthly donations (last 30 days)
        tx.donation.aggregate({
          where: {
            date: {
              gte: new Date(now.setDate(now.getDate() - 30))
            }
          },
          _sum: { amount: true },
          _count: true
        }),
        
        // Donations per day
        tx.$queryRaw`
          SELECT 
            DATE(date) as day,
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM donations
          WHERE date >= ${startDate}
          GROUP BY DATE(date)
          ORDER BY day DESC
          LIMIT 30
        `,
        
        // Donations by purpose
        tx.donation.groupBy({
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
        }),
        
        // Donations by operator
        tx.donation.groupBy({
          by: ['operatorId'],
          where: {
            date: { gte: startDate }
          },
          _count: true,
          _sum: { amount: true },
          orderBy: {
            _sum: { amount: 'desc' }
          }
        }),
        
        // Top donors
        tx.donation.groupBy({
          by: ['donorPhone', 'donorName'],
          _count: true,
          _sum: { amount: true },
          orderBy: {
            _sum: { amount: 'desc' }
          },
          take: 10
        })
      ]);

      // Get operator names for donations by operator
      const operatorIds = donationsByOperator.map(d => d.operatorId);
      const operators = await tx.user.findMany({
        where: { id: { in: operatorIds } },
        select: { id: true, name: true }
      });
      
      const operatorMap = new Map(operators.map(op => [op.id, op.name]));

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
          byPurpose: donationsByPurpose.map(item => ({
            purpose: item.purpose,
            count: item._count,
            amount: item._sum.amount
          })),
          byOperator: donationsByOperator.map(item => ({
            operatorId: item.operatorId,
            operatorName: operatorMap.get(item.operatorId) || 'Unknown',
            count: item._count,
            amount: item._sum.amount
          }))
        },
        topDonors: topDonors.map(donor => ({
          phone: donor.donorPhone,
          name: donor.donorName,
          donationCount: donor._count,
          totalAmount: donor._sum.amount
        }))
      };
    });
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
      totalAmount: donor._sum.amount
    }));
  }
}