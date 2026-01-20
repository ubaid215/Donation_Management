import prisma from '../../config/prisma.js';

export class AnalyticsService {
  constructor() {
    this.prisma = prisma;
  }

  async getDashboardMetrics() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.setDate(now.getDate() - 30));
    const weekStart = new Date(now.setDate(now.getDate() - 7));

    const [
      totalDonations,
      totalAmount,
      todayStats,
      weekStats,
      monthStats,
      operatorStats,
      recentDonations
    ] = await Promise.all([
      // Total donations
      this.prisma.donation.count(),
      
      // Total amount
      this.prisma.donation.aggregate({
        _sum: { amount: true }
      }),
      
      // Today's stats
      this.prisma.donation.aggregate({
        where: {
          date: { gte: todayStart }
        },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Week's stats
      this.prisma.donation.aggregate({
        where: {
          date: { gte: weekStart }
        },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Month's stats
      this.prisma.donation.aggregate({
        where: {
          date: { gte: monthStart }
        },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Operator stats
      this.prisma.user.count({
        where: { 
          role: 'OPERATOR',
          isActive: true,
          lastLogin: {
            gte: weekStart
          }
        }
      }),
      
      // Recent donations (last 10)
      this.prisma.donation.findMany({
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          operator: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    return {
      totals: {
        donations: totalDonations,
        amount: totalAmount._sum.amount || 0
      },
      today: {
        donations: todayStats._count,
        amount: todayStats._sum.amount || 0
      },
      week: {
        donations: weekStats._count,
        amount: weekStats._sum.amount || 0
      },
      month: {
        donations: monthStats._count,
        amount: monthStats._sum.amount || 0
      },
      operators: {
        active: operatorStats
      },
      recentDonations
    };
  }

  async getTimeSeriesData(startDate, endDate) {
    const donations = await this.prisma.$queryRaw`
      SELECT 
        DATE(date) as date,
        COUNT(*) as donations_count,
        SUM(amount) as total_amount
      FROM donations
      WHERE date >= ${startDate} AND date <= ${endDate}
      GROUP BY DATE(date)
      ORDER BY date ASC
    `;

    return donations;
  }

  async getCategoryBreakdown() {
    const categories = await this.prisma.donation.groupBy({
      by: ['purpose'],
      _count: true,
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' }
      },
      take: 8
    });

    return categories.map(cat => ({
      category: cat.purpose,
      count: cat._count,
      amount: cat._sum.amount
    }));
  }

  async getOperatorPerformance() {
    const performance = await this.prisma.user.findMany({
      where: {
        role: 'OPERATOR',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        _count: {
          select: {
            donations: {
              where: {
                date: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        },
        donations: {
          select: {
            amount: true
          },
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    return performance.map(op => {
      const totalAmount = op.donations.reduce((sum, d) => sum + d.amount, 0);
      
      return {
        id: op.id,
        name: op.name,
        email: op.email,
        lastLogin: op.lastLogin,
        donationCount: op._count.donations,
        totalAmount
      };
    });
  }
}