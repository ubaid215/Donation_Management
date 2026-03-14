// ============================================================
// features/khidmatRecord/khidmat.service.js
// Business logic for KhidmatRecord CRUD
// ============================================================

import prisma from '../../config/prisma.js';
import { createAuditLog } from '../../utils/auditLogger.js';

export class KhidmatRecordService {

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  async createRecord(data, userId, ipAddress = null) {
    const record = await prisma.$transaction(async (tx) => {
      // Verify category exists and is active
      const category = await tx.donationCategory.findUnique({
        where: { id: data.categoryId }
      });

      if (!category) throw new Error('Category not found');
      if (!category.isActive) throw new Error('Selected category is not active');

      const newRecord = await tx.khidmatRecord.create({
        data: {
          name:       data.name,
          phone:      data.phone,
          address:    data.address   || null,
          amount:     data.amount,
          categoryId: data.categoryId,
          status:     data.status    || 'RECORD_ONLY',
          notes:      data.notes     || null,
          date:       data.date ? new Date(data.date) : new Date(),
          operatorId: userId
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } }
        }
      });

      await createAuditLog({
        action:      'KHIDMAT_CREATED',
        userId,
        userRole:    'OPERATOR', // overridden in controller if ADMIN
        entityType:  'KHIDMAT_RECORD',
        entityId:    newRecord.id,
        description: `Khidmat record created for "${data.name}" — status: ${newRecord.status}`,
        metadata: {
          name:         data.name,
          phone:        data.phone,
          amount:       data.amount,
          status:       newRecord.status,
          categoryName: category.name
        },
        ipAddress
      });

      return newRecord;
    });

    return record;
  }

  // ─────────────────────────────────────────────
  // GET ALL  (with filters + pagination)
  // ─────────────────────────────────────────────
  async getAllRecords(filters = {}, requestingUser = null) {
    const {
      search,
      status,
      categoryId,
      operatorId,
      startDate,
      endDate,
      page  = 1,
      limit = 50
    } = filters;

    const pageNum  = parseInt(page,  10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    const where = {
      isDeleted: false,

      // Operators can only see their own records
      ...(requestingUser?.role === 'OPERATOR' && {
        operatorId: requestingUser.id
      }),

      ...(operatorId  && { operatorId }),
      ...(categoryId  && { categoryId }),
      ...(status      && { status }),

      ...(startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(endDate) })
        }
      },

      ...(search && {
        OR: [
          { name:    { contains: search, mode: 'insensitive' } },
          { phone:   { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { notes:   { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [records, total] = await Promise.all([
      prisma.khidmatRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:  (pageNum - 1) * limitNum,
        take:  limitNum,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } }
        }
      }),
      prisma.khidmatRecord.count({ where })
    ]);

    // Normalize Decimal → number
    const normalized = records.map(r => ({
      ...r,
      amount: parseFloat(r.amount.toString())
    }));

    return {
      records: normalized,
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // ─────────────────────────────────────────────
  // GET BY ID
  // ─────────────────────────────────────────────
  async getRecordById(id) {
    const record = await prisma.khidmatRecord.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        operator: { select: { id: true, name: true, email: true } }
      }
    });

    if (!record || record.isDeleted) throw new Error('Record not found');

    return {
      ...record,
      amount: parseFloat(record.amount.toString())
    };
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  async updateRecord(id, updateData, userId, userRole, ipAddress = null) {
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) throw new Error('Record not found');

      // Operators can only edit their own records
      if (userRole === 'OPERATOR' && existing.operatorId !== userId) {
        throw new Error('Access denied to this record');
      }

      // Validate new category if provided
      if (updateData.categoryId) {
        const category = await tx.donationCategory.findUnique({
          where: { id: updateData.categoryId }
        });
        if (!category)           throw new Error('Category not found');
        if (!category.isActive)  throw new Error('Selected category is not active');
      }

      const updated = await tx.khidmatRecord.update({
        where: { id },
        data:  updateData,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } }
        }
      });

      await createAuditLog({
        action:      'KHIDMAT_UPDATED',
        userId,
        userRole,
        entityType:  'KHIDMAT_RECORD',
        entityId:    id,
        description: `Khidmat record for "${existing.name}" updated`,
        metadata: {
          updates:        updateData,
          previousValues: {
            name:   existing.name,
            status: existing.status,
            amount: existing.amount.toString()
          }
        },
        ipAddress
      });

      return updated;
    });

    return {
      ...record,
      amount: parseFloat(record.amount.toString())
    };
  }

  // ─────────────────────────────────────────────
  // SOFT DELETE
  // ─────────────────────────────────────────────
  async deleteRecord(id, userId, userRole, reason = null, ipAddress = null) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) throw new Error('Record not found');

      if (userRole === 'OPERATOR' && existing.operatorId !== userId) {
        throw new Error('Access denied to this record');
      }

      await tx.khidmatRecord.update({
        where: { id },
        data: {
          isDeleted:      true,
          deletedAt:      new Date(),
          deletedBy:      userId,
          deletionReason: reason || null
        }
      });

      await createAuditLog({
        action:      'KHIDMAT_DELETED',
        userId,
        userRole,
        entityType:  'KHIDMAT_RECORD',
        entityId:    id,
        description: `Khidmat record for "${existing.name}" soft-deleted`,
        metadata:    { reason },
        ipAddress
      });
    });

    return { deleted: true };
  }

  // ─────────────────────────────────────────────
  // RESTORE
  // ─────────────────────────────────────────────
  async restoreRecord(id, userId, userRole, ipAddress = null) {
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } });

      if (!existing)          throw new Error('Record not found');
      if (!existing.isDeleted) throw new Error('Record is not deleted');

      const restored = await tx.khidmatRecord.update({
        where: { id },
        data: {
          isDeleted:      false,
          deletedAt:      null,
          deletedBy:      null,
          deletionReason: null
        }
      });

      await createAuditLog({
        action:      'KHIDMAT_RESTORED',
        userId,
        userRole,
        entityType:  'KHIDMAT_RECORD',
        entityId:    id,
        description: `Khidmat record for "${existing.name}" restored`,
        ipAddress
      });

      return restored;
    });

    return {
      ...record,
      amount: parseFloat(record.amount.toString())
    };
  }

  // ─────────────────────────────────────────────
  // STATS  (admin overview)
  // ─────────────────────────────────────────────
  async getStats(filters = {}) {
    const { startDate, endDate } = filters;

    const dateFilter = (startDate || endDate)
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate   && { lte: new Date(endDate) })
          }
        }
      : {};

    const baseWhere = { isDeleted: false, ...dateFilter };

    const [
      totals,
      byStatus,
      byCategory
    ] = await Promise.all([
      // Overall aggregate
      prisma.khidmatRecord.aggregate({
        where: baseWhere,
        _sum:   { amount: true },
        _count: true,
        _avg:   { amount: true }
      }),

      // Count per status
      prisma.khidmatRecord.groupBy({
        by:    ['status'],
        where: baseWhere,
        _count: true,
        _sum:   { amount: true }
      }),

      // Count per category
      prisma.khidmatRecord.groupBy({
        by:    ['categoryId'],
        where: baseWhere,
        _count: true,
        _sum:   { amount: true }
      })
    ]);

    return {
      total:        totals._count,
      totalAmount:  totals._sum.amount ? parseFloat(totals._sum.amount.toString()) : 0,
      averageAmount:totals._avg.amount ? parseFloat(totals._avg.amount.toString()) : 0,
      byStatus:     byStatus.map(s => ({
        status:      s.status,
        count:       s._count,
        totalAmount: s._sum.amount ? parseFloat(s._sum.amount.toString()) : 0
      })),
      byCategoryId: byCategory.map(c => ({
        categoryId:  c.categoryId,
        count:       c._count,
        totalAmount: c._sum.amount ? parseFloat(c._sum.amount.toString()) : 0
      }))
    };
  }
}