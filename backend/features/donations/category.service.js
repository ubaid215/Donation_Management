import prisma from '../../config/prisma.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { translateToUrdu } from '../../utils/translate.js';

export class DonationCategoryService {
  constructor() {
    this.prisma = prisma;
  }

  async createCategory(categoryData, userId, ipAddress = null) {
    // Get translation outside transaction with shorter timeout
    let nameUrdu = null;
    if (categoryData.name) {
      try {
        // Use shorter timeout for translation
        nameUrdu = await translateToUrdu(categoryData.name, 2000);
      } catch (error) {
        console.warn('⚠️ Translation failed, using English as fallback:', error.message);
        nameUrdu = categoryData.name;
      }
    }

    const category = await this.prisma.$transaction(async (tx) => {
      // Check if category name already exists
      const existing = await tx.donationCategory.findUnique({
        where: { name: categoryData.name }
      });

      if (existing) {
        throw new Error('Category with this name already exists');
      }

      const newCategory = await tx.donationCategory.create({
        data: {
          name: categoryData.name,
          nameUrdu: nameUrdu || categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon || 'Tag',
          color: categoryData.color || '#3b82f6',
          isActive: categoryData.isActive !== undefined ? categoryData.isActive : true
        }
      });

      // Log the action
      await createAuditLog({
        action: 'USER_CREATED',
        userId,
        userRole: 'ADMIN',
        entityType: 'DONATION_CATEGORY',
        entityId: newCategory.id,
        description: `Donation category "${categoryData.name}" created`,
        metadata: {
          name: categoryData.name,
          nameUrdu: nameUrdu,
          description: categoryData.description,
          icon: categoryData.icon,
          color: categoryData.color
        },
        ipAddress
      });

      return newCategory;
    }, {
      timeout: 30000, // Increase transaction timeout to 30 seconds
    });

    return category;
  }

  async getAllCategories(filters = {}) {
    const { isActive, search, page = 1, limit = 50 } = filters;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    const where = {
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nameUrdu: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [categories, total] = await Promise.all([
      this.prisma.donationCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          _count: {
            select: { donations: true }
          },
          donations: {
            select: {
              amount: true
            }
          }
        }
      }),
      this.prisma.donationCategory.count({ where })
    ]);

    // Calculate total amount for each category
    const categoriesWithStats = categories.map(cat => {
      const totalAmount = cat.donations.reduce((sum, donation) => {
        const amount = donation.amount ? parseFloat(donation.amount.toString()) : 0;
        return sum + amount;
      }, 0);
      
      return {
        id: cat.id,
        name: cat.name,
        nameUrdu: cat.nameUrdu,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        donationCount: cat._count.donations,
        totalAmount: totalAmount,
        averageAmount: cat._count.donations > 0 ? totalAmount / cat._count.donations : 0
      };
    });

    return {
      categories: categoriesWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  async getCategoryById(id) {
    const category = await this.prisma.donationCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { donations: true }
        },
        donations: {
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            id: true,
            donorName: true,
            amount: true,
            date: true,
            operator: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const totalAmount = category.donations.reduce((sum, donation) => {
      return sum + parseFloat(donation.amount.toString());
    }, 0);

    return {
      ...category,
      donationCount: category._count.donations,
      totalAmount: totalAmount,
      averageAmount: category._count.donations > 0 ? totalAmount / category._count.donations : 0
    };
  }

  async getActiveCategories() {
    const categories = await this.prisma.donationCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { donations: true }
        },
        donations: {
          select: {
            amount: true
          }
        }
      }
    });

    return categories.map(cat => {
      const totalAmount = cat.donations.reduce((sum, donation) => {
        return sum + parseFloat(donation.amount.toString());
      }, 0);
      
      return {
        id: cat.id,
        name: cat.name,
        nameUrdu: cat.nameUrdu,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        donationCount: cat._count.donations,
        totalAmount: totalAmount
      };
    });
  }

  async updateCategory(id, updateData, userId, ipAddress = null) {
    console.log("\n========== CATEGORY SERVICE: updateCategory ==========");
    console.log("ID:", id);
    console.log("Update Data:", updateData);

    // Get translation outside transaction
    let nameUrdu = null;
    if (updateData.name) {
      try {
        nameUrdu = await translateToUrdu(updateData.name, 2000);
      } catch (error) {
        console.warn('⚠️ Translation failed for name update:', error.message);
        nameUrdu = updateData.name;
      }
    }

    try {
      const category = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.donationCategory.findUnique({
          where: { id }
        });

        if (!existing) {
          throw new Error("Category not found");
        }

        const updatePayload = { ...updateData };

        // If name is being updated, check for duplicates and use translation
        if (updateData.name && updateData.name !== existing.name) {
          const duplicate = await tx.donationCategory.findUnique({
            where: { name: updateData.name }
          });

          if (duplicate && duplicate.id !== id) {
            throw new Error("Category with this name already exists");
          }

          updatePayload.nameUrdu = nameUrdu || updateData.name;
        }

        const updatedCategory = await tx.donationCategory.update({
          where: { id },
          data: updatePayload
        });

        await createAuditLog({
          action: "USER_UPDATED",
          userId,
          userRole: "ADMIN",
          entityType: "DONATION_CATEGORY",
          entityId: updatedCategory.id,
          description: `Donation category "${updatedCategory.name}" updated`,
          metadata: {
            updates: updateData,
            previousValues: {
              name: existing.name,
              description: existing.description,
              isActive: existing.isActive
            }
          },
          ipAddress
        });

        return updatedCategory;
      }, {
        timeout: 30000,
      });

      return category;
    } catch (error) {
      console.error("updateCategory ERROR:", error);
      throw error;
    }
  }

  async deleteCategory(id, userId, ipAddress = null) {
    const result = await this.prisma.$transaction(async (tx) => {
      const category = await tx.donationCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: { donations: true }
          }
        }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      if (category._count.donations > 0) {
        throw new Error(
          `Cannot delete category with ${category._count.donations} associated donations. Please reassign or remove them first.`
        );
      }

      await tx.donationCategory.delete({
        where: { id }
      });

      await createAuditLog({
        action: 'USER_UPDATED',
        userId,
        userRole: 'ADMIN',
        entityType: 'DONATION_CATEGORY',
        entityId: id,
        description: `Donation category "${category.name}" deleted`,
        metadata: {
          deletedCategory: {
            name: category.name,
            description: category.description
          }
        },
        ipAddress
      });

      return { deleted: true, category };
    }, {
      timeout: 30000,
    });

    return result;
  }

  async toggleCategoryStatus(id, userId, ipAddress = null) {
    const category = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.donationCategory.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new Error('Category not found');
      }

      const updatedCategory = await tx.donationCategory.update({
        where: { id },
        data: { isActive: !existing.isActive }
      });

      await createAuditLog({
        action: 'USER_UPDATED',
        userId,
        userRole: 'ADMIN',
        entityType: 'DONATION_CATEGORY',
        entityId: updatedCategory.id,
        description: `Donation category "${updatedCategory.name}" ${updatedCategory.isActive ? 'activated' : 'deactivated'}`,
        metadata: {
          previousStatus: existing.isActive,
          newStatus: updatedCategory.isActive
        },
        ipAddress
      });

      return updatedCategory;
    }, {
      timeout: 30000,
    });

    return category;
  }

  async getCategoryStats(id) {
    const stats = await this.prisma.donation.aggregate({
      where: { categoryId: id },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
      _max: { amount: true },
      _min: { amount: true }
    });

    const recentDonations = await this.prisma.donation.findMany({
      where: { categoryId: id },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        donorName: true,
        amount: true,
        date: true,
        operator: {
          select: { name: true }
        }
      }
    });

    return {
      totalAmount: stats._sum.amount ? parseFloat(stats._sum.amount.toString()) : 0,
      totalCount: stats._count,
      averageAmount: stats._avg.amount ? parseFloat(stats._avg.amount.toString()) : 0,
      maxAmount: stats._max.amount ? parseFloat(stats._max.amount.toString()) : 0,
      minAmount: stats._min.amount ? parseFloat(stats._min.amount.toString()) : 0,
      recentDonations: recentDonations.map(donation => ({
        ...donation,
        amount: parseFloat(donation.amount.toString())
      }))
    };
  }

  async migrateDonationsToCategories() {
    try {
      console.log('Starting migration of donations to categories...');
      
      const donations = await this.prisma.donation.findMany({
        where: {
          OR: [
            { categoryId: null },
            { categoryId: undefined }
          ]
        }
      });

      console.log(`Found ${donations.length} donations without categories`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const donation of donations) {
        try {
          let category = await this.prisma.donationCategory.findFirst({
            where: {
              name: donation.purpose,
              isActive: true
            }
          });

          if (!category) {
            // Get translation for new category
            let nameUrdu = null;
            try {
              nameUrdu = await translateToUrdu(donation.purpose, 2000);
            } catch (error) {
              nameUrdu = donation.purpose;
            }

            category = await this.prisma.donationCategory.create({
              data: {
                name: donation.purpose,
                nameUrdu: nameUrdu,
                description: `Category for ${donation.purpose} donations`,
                isActive: true
              }
            });
            console.log(`Created new category: ${category.name}`);
          }

          await this.prisma.donation.update({
            where: { id: donation.id },
            data: { categoryId: category.id }
          });

          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} donations...`);
          }
        } catch (error) {
          console.error(`Error updating donation ${donation.id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`Migration completed. Updated: ${updatedCount}, Errors: ${errorCount}`);
      return { updated: updatedCount, errors: errorCount };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}