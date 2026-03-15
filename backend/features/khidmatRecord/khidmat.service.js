// ============================================================
// features/khidmatRecord/khidmat.service.js
// Backend service — full version with installments + analytics
// ============================================================

import prisma from '../../config/prisma.js'
import { createAuditLog } from '../../utils/auditLogger.js'

// ─── Helpers ─────────────────────────────────────────────────

const toNum = (d) => parseFloat(d?.toString() ?? '0')

/** Normalise Decimal fields to plain JS numbers */
const normalizeRecord = (r) => ({
  ...r,
  amount:          toNum(r.amount),
  receivedAmount:  toNum(r.receivedAmount),
  remainingAmount: toNum(r.amount) - toNum(r.receivedAmount),
  payments: (r.payments || []).map(p => ({ ...p, amount: toNum(p.amount) }))
})

/**
 * Derive status automatically from financial figures.
 * If the caller passes an explicit status we honour it,
 * otherwise we infer it from the numbers.
 */
const deriveStatus = (totalAmount, receivedAmount, explicitStatus) => {
  if (explicitStatus) return explicitStatus
  if (receivedAmount <= 0)           return 'RECORD_ONLY'
  if (receivedAmount >= totalAmount) return 'COMPLETED'
  return 'PARTIAL'
}

// ─────────────────────────────────────────────────────────────
export class KhidmatRecordService {

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  async createRecord(data, userId, ipAddress = null) {
    const record = await prisma.$transaction(async (tx) => {
      const category = await tx.donationCategory.findUnique({ where: { id: data.categoryId } })
      if (!category)          throw new Error('Category not found')
      if (!category.isActive) throw new Error('Selected category is not active')

      const receivedAmount = parseFloat(data.receivedAmount ?? 0)
      const totalAmount    = parseFloat(data.amount)
      const status         = deriveStatus(totalAmount, receivedAmount, data.status)

      const newRecord = await tx.khidmatRecord.create({
        data: {
          name:           data.name,
          phone:          data.phone,
          address:        data.address   || null,
          amount:         totalAmount,
          receivedAmount: receivedAmount,
          categoryId:     data.categoryId,
          status,
          notes:          data.notes     || null,
          date:           data.date ? new Date(data.date) : new Date(),
          operatorId:     userId,
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: true,
        }
      })

      // Log initial payment as first installment if amount > 0
      if (receivedAmount > 0) {
        await tx.khidmatPayment.create({
          data: {
            recordId: newRecord.id,
            amount:   receivedAmount,
            notes:    'Initial payment on record creation',
            paidAt:   newRecord.date,
          }
        })
      }

      await createAuditLog({
        action:      'KHIDMAT_CREATED',
        userId,
        userRole:    'OPERATOR',
        entityType:  'KHIDMAT_RECORD',
        entityId:    newRecord.id,
        description: `Khidmat record created for "${data.name}" — pledged: ${totalAmount}, received: ${receivedAmount}`,
        metadata:    { name: data.name, phone: data.phone, amount: totalAmount, receivedAmount, status, categoryName: category.name },
        ipAddress
      })

      return newRecord
    })

    return normalizeRecord(record)
  }

  // ─────────────────────────────────────────────
  // ADD PAYMENT (installment)
  // ─────────────────────────────────────────────
  async addPayment(recordId, paymentData, userId, userRole, ipAddress = null) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({
        where: { id: recordId },
        include: { category: { select: { name: true } } }
      })

      if (!existing || existing.isDeleted) throw new Error('Record not found')
      if (userRole === 'OPERATOR' && existing.operatorId !== userId) {
        throw new Error('Access denied to this record')
      }

      const paymentAmount = parseFloat(paymentData.amount)
      const newReceived   = toNum(existing.receivedAmount) + paymentAmount
      const totalAmount   = toNum(existing.amount)

      if (newReceived > totalAmount) {
        throw new Error(
          `Payment of Rs ${paymentAmount} would exceed total pledged amount of Rs ${totalAmount}. ` +
          `Already received: Rs ${toNum(existing.receivedAmount)}`
        )
      }

      const newStatus = deriveStatus(totalAmount, newReceived, null)

      const payment = await tx.khidmatPayment.create({
        data: {
          recordId,
          amount:  paymentAmount,
          notes:   paymentData.notes  || null,
          paidAt:  paymentData.paidAt ? new Date(paymentData.paidAt) : new Date(),
        }
      })

      const updatedRecord = await tx.khidmatRecord.update({
        where: { id: recordId },
        data:  { receivedAmount: newReceived, status: newStatus },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: { orderBy: { paidAt: 'desc' } },
        }
      })

      await createAuditLog({
        action:      'KHIDMAT_PAYMENT_ADDED',
        userId,
        userRole,
        entityType:  'KHIDMAT_RECORD',
        entityId:    recordId,
        description: `Payment of Rs ${paymentAmount} added for "${existing.name}" — total received: Rs ${newReceived} / Rs ${totalAmount}`,
        metadata: {
          paymentAmount,
          previousReceived: toNum(existing.receivedAmount),
          newReceived,
          totalAmount,
          remainingAmount:  totalAmount - newReceived,
          newStatus,
          previousStatus:   existing.status,
          notes:            paymentData.notes
        },
        ipAddress
      })

      return { record: updatedRecord, payment }
    })

    return {
      record:  normalizeRecord(result.record),
      payment: { ...result.payment, amount: toNum(result.payment.amount) }
    }
  }

  // ─────────────────────────────────────────────
  // GET PAYMENT HISTORY
  // ─────────────────────────────────────────────
  async getPayments(recordId) {
    const record = await prisma.khidmatRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true, name: true, amount: true,
        receivedAmount: true, status: true,
        payments: { orderBy: { paidAt: 'desc' } }
      }
    })

    if (!record) throw new Error('Record not found')

    return {
      recordId:       record.id,
      name:           record.name,
      totalAmount:    toNum(record.amount),
      receivedAmount: toNum(record.receivedAmount),
      remainingAmount:toNum(record.amount) - toNum(record.receivedAmount),
      status:         record.status,
      payments:       record.payments.map(p => ({ ...p, amount: toNum(p.amount) }))
    }
  }

  // ─────────────────────────────────────────────
  // GET ALL  (paginated + filtered)
  // ─────────────────────────────────────────────
  async getAllRecords(filters = {}, requestingUser = null) {
    const {
      search, status, categoryId, operatorId,
      startDate, endDate, page = 1, limit = 50
    } = filters

    const pageNum  = parseInt(page,  10) || 1
    const limitNum = parseInt(limit, 10) || 50

    const where = {
      isDeleted: false,
      ...(requestingUser?.role === 'OPERATOR' && { operatorId: requestingUser.id }),
      ...(operatorId  && { operatorId }),
      ...(categoryId  && { categoryId }),
      ...(status      && { status }),
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(endDate) })
        }
      }),
      ...(search && {
        OR: [
          { name:    { contains: search, mode: 'insensitive' } },
          { phone:   { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { notes:   { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [records, total] = await Promise.all([
      prisma.khidmatRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (pageNum - 1) * limitNum,
        take:    limitNum,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: { orderBy: { paidAt: 'desc' }, take: 5 }
        }
      }),
      prisma.khidmatRecord.count({ where })
    ])

    return {
      records: records.map(normalizeRecord),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    }
  }

  // ─────────────────────────────────────────────
  // GET BY ID
  // ─────────────────────────────────────────────
  async getRecordById(id) {
    const record = await prisma.khidmatRecord.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        operator: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { paidAt: 'desc' } }
      }
    })

    if (!record || record.isDeleted) throw new Error('Record not found')
    return normalizeRecord(record)
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  async updateRecord(id, updateData, userId, userRole, ipAddress = null) {
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } })
      if (!existing || existing.isDeleted) throw new Error('Record not found')
      if (userRole === 'OPERATOR' && existing.operatorId !== userId) throw new Error('Access denied')

      if (updateData.categoryId) {
        const cat = await tx.donationCategory.findUnique({ where: { id: updateData.categoryId } })
        if (!cat)          throw new Error('Category not found')
        if (!cat.isActive) throw new Error('Selected category is not active')
      }

      // Guard: new total amount must not be less than already received
      const newTotal    = updateData.amount ? parseFloat(updateData.amount) : toNum(existing.amount)
      const curReceived = toNum(existing.receivedAmount)
      if (curReceived > newTotal) {
        throw new Error(
          `Cannot reduce total to Rs ${newTotal} — already received Rs ${curReceived}`
        )
      }

      // Re-derive status unless explicitly provided
      if (!updateData.status) {
        updateData.status = deriveStatus(newTotal, curReceived, null)
      }

      const updated = await tx.khidmatRecord.update({
        where: { id },
        data:  updateData,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: { orderBy: { paidAt: 'desc' } }
        }
      })

      await createAuditLog({
        action: 'KHIDMAT_UPDATED', userId, userRole,
        entityType: 'KHIDMAT_RECORD', entityId: id,
        description: `Khidmat record for "${existing.name}" updated`,
        metadata: {
          updates: updateData,
          previousValues: { name: existing.name, status: existing.status, amount: existing.amount.toString() }
        },
        ipAddress
      })

      return updated
    })

    return normalizeRecord(record)
  }

  // ─────────────────────────────────────────────
  // SOFT DELETE
  // ─────────────────────────────────────────────
  async deleteRecord(id, userId, userRole, reason = null, ipAddress = null) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } })
      if (!existing || existing.isDeleted) throw new Error('Record not found')
      if (userRole === 'OPERATOR' && existing.operatorId !== userId) throw new Error('Access denied')

      await tx.khidmatRecord.update({
        where: { id },
        data:  { isDeleted: true, deletedAt: new Date(), deletedBy: userId, deletionReason: reason || null }
      })

      await createAuditLog({
        action: 'KHIDMAT_DELETED', userId, userRole,
        entityType: 'KHIDMAT_RECORD', entityId: id,
        description: `Khidmat record deleted`,
        metadata: { reason }, ipAddress
      })
    })

    return { deleted: true }
  }

  // ─────────────────────────────────────────────
  // RESTORE
  // ─────────────────────────────────────────────
  async restoreRecord(id, userId, userRole, ipAddress = null) {
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } })
      if (!existing)           throw new Error('Record not found')
      if (!existing.isDeleted) throw new Error('Record is not deleted')

      const restored = await tx.khidmatRecord.update({
        where: { id },
        data:  { isDeleted: false, deletedAt: null, deletedBy: null, deletionReason: null }
      })

      await createAuditLog({
        action: 'KHIDMAT_RESTORED', userId, userRole,
        entityType: 'KHIDMAT_RECORD', entityId: id,
        description: `Khidmat record for "${existing.name}" restored`,
        ipAddress
      })

      return restored
    })

    return normalizeRecord(record)
  }

  // ─────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────
  async getStats(filters = {}) {
    const { startDate, endDate } = filters
    const dateFilter = (startDate || endDate) ? {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate   && { lte: new Date(endDate) })
      }
    } : {}

    const baseWhere = { isDeleted: false, ...dateFilter }

    const [totals, byStatus, byCategory] = await Promise.all([
      prisma.khidmatRecord.aggregate({
        where: baseWhere,
        _sum:   { amount: true, receivedAmount: true },
        _count: true,
        _avg:   { amount: true }
      }),
      prisma.khidmatRecord.groupBy({
        by: ['status'], where: baseWhere,
        _count: true,
        _sum:   { amount: true, receivedAmount: true }
      }),
      prisma.khidmatRecord.groupBy({
        by: ['categoryId'], where: baseWhere,
        _count: true,
        _sum:   { amount: true, receivedAmount: true }
      })
    ])

    const totalPledged  = toNum(totals._sum.amount)
    const totalReceived = toNum(totals._sum.receivedAmount)

    return {
      total:           totals._count,
      totalPledged,
      totalReceived,
      totalRemaining:  totalPledged - totalReceived,
      averagePledged:  totals._avg.amount ? toNum(totals._avg.amount) : 0,
      collectionRate:  totalPledged > 0 ? Math.round((totalReceived / totalPledged) * 100) : 0,
      byStatus: byStatus.map(s => ({
        status:        s.status,
        count:         s._count,
        totalPledged:  toNum(s._sum.amount),
        totalReceived: toNum(s._sum.receivedAmount)
      })),
      byCategoryId: byCategory.map(c => ({
        categoryId:    c.categoryId,
        count:         c._count,
        totalPledged:  toNum(c._sum.amount),
        totalReceived: toNum(c._sum.receivedAmount)
      }))
    }
  }

  // ─────────────────────────────────────────────
  // ANALYTICS  (chart data)
  //
  // Returns:
  //   monthlyTrend  — [ { month, pledged, received, remaining, count } ]
  //   byCategory    — [ { categoryId, name, color, pledged, received, remaining, count, collectionRate } ]
  //
  // NOTE: Uses Prisma groupBy instead of $queryRaw to avoid
  // template-literal conditional issues across DB drivers.
  // ─────────────────────────────────────────────
  async getAnalytics(filters = {}) {
    const { startDate, endDate, categoryId } = filters

    const baseWhere = {
      isDeleted: false,
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(endDate) })
        }
      }),
      ...(categoryId && { categoryId })
    }

    // ── By category (Prisma groupBy — no raw SQL needed) ──────
    const categoryRaw = await prisma.khidmatRecord.groupBy({
      by:    ['categoryId'],
      where: baseWhere,
      _count: true,
      _sum:   { amount: true, receivedAmount: true }
    })

    // Enrich with category name + color
    const categoryIds = categoryRaw.map(c => c.categoryId)
    const categories  = categoryIds.length > 0
      ? await prisma.donationCategory.findMany({
          where:  { id: { in: categoryIds } },
          select: { id: true, name: true, color: true, icon: true }
        })
      : []

    const catMap     = Object.fromEntries(categories.map(c => [c.id, c]))
    const byCategory = categoryRaw.map(row => {
      const pledged  = toNum(row._sum.amount)
      const received = toNum(row._sum.receivedAmount)
      return {
        categoryId:     row.categoryId,
        name:           catMap[row.categoryId]?.name  || 'Unknown',
        color:          catMap[row.categoryId]?.color || '#3b82f6',
        icon:           catMap[row.categoryId]?.icon  || 'Tag',
        count:          row._count,
        pledged,
        received,
        remaining:      pledged - received,
        collectionRate: pledged > 0 ? Math.round((received / pledged) * 100) : 0
      }
    })

    // ── Monthly trend (raw SQL — safest approach for date grouping) ──
    // Build WHERE clauses as separate strings to avoid template issues
    const conditions = [`"isDeleted" = false`]
    const values     = []

    if (startDate) {
      values.push(new Date(startDate))
      conditions.push(`date >= $${values.length}`)
    }
    if (endDate) {
      values.push(new Date(endDate))
      conditions.push(`date <= $${values.length}`)
    }
    if (categoryId) {
      values.push(categoryId)
      conditions.push(`"categoryId" = $${values.length}`)
    }

    const whereClause = conditions.join(' AND ')

    const monthlyRaw = await prisma.$queryRawUnsafe(
      `SELECT
         TO_CHAR(date, 'YYYY-MM')       AS month,
         SUM(amount)::float             AS pledged,
         SUM("receivedAmount")::float   AS received,
         COUNT(*)::int                  AS count
       FROM khidmat_records
       WHERE ${whereClause}
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month ASC`,
      ...values
    )

    const monthlyTrend = monthlyRaw.map(r => ({
      month:     r.month,
      pledged:   Number(r.pledged)  || 0,
      received:  Number(r.received) || 0,
      remaining: (Number(r.pledged) || 0) - (Number(r.received) || 0),
      count:     Number(r.count)    || 0
    }))

    return { monthlyTrend, byCategory }
  }
}