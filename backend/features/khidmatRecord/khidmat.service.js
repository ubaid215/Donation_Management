// ============================================================
// features/khidmatRecord/khidmat.service.js
// COMPLETE FIXED VERSION - All methods properly organized
// ============================================================

import prisma from '../../config/prisma.js'
import { createAuditLog } from '../../utils/auditLogger.js'
import { translateToUrdu } from '../../utils/translate.js'
import { sendKhidmatWhatsApp } from '../../utils/recordNotification.js'

// ─── Helpers ─────────────────────────────────────────────────

const toNum = (d) => parseFloat(d?.toString() ?? '0')

const normalizeRecord = (r) => ({
  ...r,
  amount: toNum(r.amount),
  receivedAmount: toNum(r.receivedAmount),
  remainingAmount: toNum(r.amount) - toNum(r.receivedAmount),
  payments: (r.payments || []).map(p => ({ ...p, amount: toNum(p.amount) }))
})

const deriveStatus = (totalAmount, receivedAmount, explicitStatus) => {
  if (explicitStatus) return explicitStatus
  if (receivedAmount <= 0) return 'RECORD_ONLY'
  if (receivedAmount >= totalAmount) return 'COMPLETED'
  return 'PARTIAL'
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/


// ─────────────────────────────────────────────────────────────
export class KhidmatRecordService {

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  async createRecord(data, userId, ipAddress = null) {
    let nameUrdu = null;
    if (data.name) {
      try {
        nameUrdu = await translateToUrdu(data.name, 2000);
      } catch (error) {
        console.warn('⚠️ Translation failed for name:', error.message);
        nameUrdu = data.name;
      }
    }

    const record = await prisma.$transaction(async (tx) => {
      const category = await tx.donationCategory.findUnique({ 
        where: { id: data.categoryId } 
      });
      
      if (!category) throw new Error('Category not found');
      if (!category.isActive) throw new Error('Selected category is not active');

      const receivedAmount = parseFloat(data.receivedAmount ?? 0);
      const totalAmount = parseFloat(data.amount);
      const status = deriveStatus(totalAmount, receivedAmount, data.status);

      const newRecord = await tx.khidmatRecord.create({
        data: {
          name: data.name,
          nameUrdu: nameUrdu || data.nameUrdu || null,
          phone: data.phone,
          address: data.address || null,
          amount: totalAmount,
          receivedAmount: receivedAmount,
          categoryId: data.categoryId,
          status,
          notes: data.notes || null,
          date: data.date ? new Date(data.date) : new Date(),
          operatorId: userId,
        },
        include: {
          category: { select: { id: true, name: true, nameUrdu: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: true,
        }
      });

      if (receivedAmount > 0) {
        await tx.khidmatPayment.create({
          data: {
            recordId: newRecord.id,
            amount: receivedAmount,
            notes: 'Initial payment on record creation',
            paidAt: newRecord.date,
          }
        });
      }

      await createAuditLog({
        action: 'KHIDMAT_CREATED',
        userId,
        userRole: 'OPERATOR',
        entityType: 'KHIDMAT_RECORD',
        entityId: newRecord.id,
        description: `Khidmat record created for "${data.name}"`,
        metadata: { 
          name: data.name, 
          nameUrdu,
          phone: data.phone, 
          amount: totalAmount, 
          receivedAmount, 
          status, 
          categoryName: category.name 
        },
        ipAddress
      });

      return newRecord;
    }, { timeout: 30000 });

    return normalizeRecord(record);
  }

  // ─────────────────────────────────────────────
  // GET ALL RECORDS (paginated + filtered)
  // ─────────────────────────────────────────────
  async getAllRecords(filters = {}, requestingUser = null) {
    const {
      search, status, categoryId, operatorId,
      startDate, endDate, page = 1, limit = 50
    } = filters

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 50

    const where = {
      isDeleted: false,
      ...(requestingUser?.role === 'OPERATOR' && { operatorId: requestingUser.id }),
      ...(operatorId && { operatorId }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nameUrdu: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [records, total] = await Promise.all([
      prisma.khidmatRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true, nameUrdu: true, icon: true, color: true } },
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
        category: { select: { id: true, name: true, nameUrdu: true, icon: true, color: true } },
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
    let nameUrdu = null;
    if (updateData.name) {
      try {
        nameUrdu = await translateToUrdu(updateData.name, 2000);
      } catch (error) {
        console.warn('⚠️ Translation failed for name update:', error.message);
        nameUrdu = updateData.name;
      }
    }

    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.khidmatRecord.findUnique({ where: { id } });
      if (!existing || existing.isDeleted) throw new Error('Record not found');
      if (userRole === 'OPERATOR' && existing.operatorId !== userId) throw new Error('Access denied');

      if (updateData.categoryId) {
        const cat = await tx.donationCategory.findUnique({ where: { id: updateData.categoryId } });
        if (!cat) throw new Error('Category not found');
        if (!cat.isActive) throw new Error('Selected category is not active');
      }

      const newTotal = updateData.amount ? parseFloat(updateData.amount) : toNum(existing.amount);
      const curReceived = toNum(existing.receivedAmount);
      if (curReceived > newTotal) {
        throw new Error(
          `Cannot reduce total to Rs ${newTotal} — already received Rs ${curReceived}`
        );
      }

      if (updateData.name && updateData.name !== existing.name) {
        updateData.nameUrdu = nameUrdu || updateData.name;
      }

      if (!updateData.status) {
        updateData.status = deriveStatus(newTotal, curReceived, null);
      }

      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const updated = await tx.khidmatRecord.update({
        where: { id },
        data: updateData,
        include: {
          category: { select: { id: true, name: true, nameUrdu: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: { orderBy: { paidAt: 'desc' } }
        }
      });

      await createAuditLog({
        action: 'KHIDMAT_UPDATED', userId, userRole,
        entityType: 'KHIDMAT_RECORD', entityId: id,
        description: `Khidmat record for "${existing.name}" updated`,
        metadata: {
          updates: updateData,
          previousValues: { 
            name: existing.name, 
            nameUrdu: existing.nameUrdu,
            status: existing.status, 
            amount: existing.amount.toString() 
          }
        },
        ipAddress
      });

      return updated;
    }, { timeout: 30000 });

    return normalizeRecord(record);
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
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId, deletionReason: reason || null }
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
      if (!existing) throw new Error('Record not found')
      if (!existing.isDeleted) throw new Error('Record is not deleted')

      const restored = await tx.khidmatRecord.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null, deletedBy: null, deletionReason: null }
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

  // ============================================================
  // PAYMENT OPERATIONS
  // ============================================================

  // ─────────────────────────────────────────────
  // ADD PAYMENT
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
      const newReceived = toNum(existing.receivedAmount) + paymentAmount
      const totalAmount = toNum(existing.amount)

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
          amount: paymentAmount,
          notes: paymentData.notes || null,
          paidAt: paymentData.paidAt ? new Date(paymentData.paidAt) : new Date(),
        }
      })

      const updatedRecord = await tx.khidmatRecord.update({
        where: { id: recordId },
        data: { receivedAmount: newReceived, status: newStatus },
        include: {
          category: { select: { id: true, name: true, nameUrdu: true, icon: true, color: true } },
          operator: { select: { id: true, name: true } },
          payments: { orderBy: { paidAt: 'desc' } },
        }
      })

      await createAuditLog({
        action: 'KHIDMAT_PAYMENT_ADDED',
        userId,
        userRole,
        entityType: 'KHIDMAT_RECORD',
        entityId: recordId,
        description: `Payment of Rs ${paymentAmount} added for "${existing.name}"`,
        metadata: {
          paymentAmount,
          previousReceived: toNum(existing.receivedAmount),
          newReceived,
          totalAmount,
          remainingAmount: totalAmount - newReceived,
          newStatus,
          previousStatus: existing.status,
          notes: paymentData.notes
        },
        ipAddress
      })

      return { record: updatedRecord, payment }
    })

    return {
      record: normalizeRecord(result.record),
      payment: { ...result.payment, amount: toNum(result.payment.amount) }
    }
  }

  // ─────────────────────────────────────────────
  // GET PAYMENTS
  // ─────────────────────────────────────────────
  async getPayments(recordId) {
    const record = await prisma.khidmatRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true, name: true, nameUrdu: true, amount: true,
        receivedAmount: true, status: true,
        payments: { orderBy: { paidAt: 'desc' } }
      }
    })

    if (!record) throw new Error('Record not found')

    return {
      recordId: record.id,
      name: record.name,
      nameUrdu: record.nameUrdu,
      totalAmount: toNum(record.amount),
      receivedAmount: toNum(record.receivedAmount),
      remainingAmount: toNum(record.amount) - toNum(record.receivedAmount),
      status: record.status,
      payments: record.payments.map(p => ({ ...p, amount: toNum(p.amount) }))
    }
  }

  // ============================================================
  // PERSON OPERATIONS
  // ============================================================

  // ─────────────────────────────────────────────
  // GET GROUPED BY PERSON
  // ─────────────────────────────────────────────
  async getRecordsGroupedByPerson(filters = {}, requestingUser = null) {
    const {
      search, status, categoryId, year,
      startDate, endDate
    } = filters

    let dateStart = startDate
    let dateEnd = endDate
    if (year) {
      dateStart = `${year}-01-01`
      dateEnd = `${year}-12-31`
    }

    const where = {
      isDeleted: false,
      ...(requestingUser?.role === 'OPERATOR' && { operatorId: requestingUser.id }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...((dateStart || dateEnd) && {
        date: {
          ...(dateStart && { gte: new Date(dateStart) }),
          ...(dateEnd && { lte: new Date(dateEnd) })
        }
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nameUrdu: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      })
    }

    const records = await prisma.khidmatRecord.findMany({
      where,
      orderBy: [{ name: 'asc' }, { date: 'desc' }],
      take: 10000,
      include: {
        category: { select: { id: true, name: true, nameUrdu: true, icon: true, color: true } },
        operator: { select: { id: true, name: true } },
        payments: { orderBy: { paidAt: 'desc' }, take: 3 }
      }
    })

    const normalized = records.map(normalizeRecord)
    const personMap = new Map()

    for (const record of normalized) {
      const phoneKey = (record.phone || '').replace(/\D/g, '') || record.name.toLowerCase().trim()
      if (!personMap.has(phoneKey)) {
        personMap.set(phoneKey, {
          key: phoneKey,
          name: record.name,
          nameUrdu: record.nameUrdu,
          phone: record.phone,
          address: record.address,
          records: [],
          totalPledged: 0,
          totalReceived: 0,
          totalRemaining: 0,
          recordCount: 0,
        })
      }
      const person = personMap.get(phoneKey)
      person.records.push(record)
      person.totalPledged += record.amount
      person.totalReceived += record.receivedAmount
      person.totalRemaining += record.remainingAmount
      person.recordCount += 1
      if (record.name) person.name = record.name
      if (record.nameUrdu) person.nameUrdu = record.nameUrdu
      if (record.address) person.address = record.address
    }

    const people = Array.from(personMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    )

    return {
      people,
      totalPeople: people.length,
      totalRecords: normalized.length,
      year: year || null,
      filters: { search, status, categoryId, startDate: dateStart, endDate: dateEnd }
    }
  }

  // ─────────────────────────────────────────────
  // GET PERSON PAYMENTS (Full history by category)
  // ─────────────────────────────────────────────
  async getPersonPayments(phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    
    const records = await prisma.khidmatRecord.findMany({
      where: {
        phone: {
          contains: cleanPhone,
          mode: 'insensitive'
        },
        isDeleted: false
      },
      include: {
        category: { 
          select: { 
            id: true, 
            name: true, 
            nameUrdu: true, 
            color: true, 
            icon: true 
          } 
        },
        payments: { 
          orderBy: { paidAt: 'desc' } 
        },
        operator: { 
          select: { id: true, name: true } 
        }
      },
      orderBy: [
        { category: { name: 'asc' } },
        { date: 'desc' }
      ]
    })

    if (records.length === 0) {
      throw new Error('No records found for this phone number')
    }

    // Group by category
    const byCategory = records.reduce((acc, record) => {
      const catId = record.categoryId || 'uncategorized'
      
      if (!acc[catId]) {
        acc[catId] = {
          category: record.category || { 
            id: 'uncategorized', 
            name: 'Uncategorized',
            color: '#94a3b8' 
          },
          records: [],
          totalPledged: 0,
          totalReceived: 0,
          totalRemaining: 0,
          recordCount: 0
        }
      }
      
      const amount = parseFloat(record.amount)
      const received = parseFloat(record.receivedAmount)
      
      acc[catId].records.push({
        ...record,
        amount,
        receivedAmount: received,
        remainingAmount: amount - received
      })
      
      acc[catId].totalPledged += amount
      acc[catId].totalReceived += received
      acc[catId].totalRemaining += (amount - received)
      acc[catId].recordCount++
      
      return acc
    }, {})

    const totals = Object.values(byCategory).reduce((acc, cat) => {
      acc.totalPledged += cat.totalPledged
      acc.totalReceived += cat.totalReceived
      acc.totalRemaining += cat.totalRemaining
      acc.totalRecords += cat.recordCount
      return acc
    }, { totalPledged: 0, totalReceived: 0, totalRemaining: 0, totalRecords: 0 })

    return {
      phone: cleanPhone,
      byCategory,
      totals,
      allRecords: records
    }
  }

  // ─────────────────────────────────────────────
  // SEND WHATSAPP TO ALL RECORDS OF A PERSON
  // ─────────────────────────────────────────────
  async sendPersonWhatsApp(phone, statusFilter, userId, userRole, ipAddress) {
    const cleanPhone = phone.replace(/\D/g, '')
    
    const where = {
      phone: {
        contains: cleanPhone,
        mode: 'insensitive'
      },
      isDeleted: false,
      ...(statusFilter && { status: statusFilter })
    }

    const records = await prisma.khidmatRecord.findMany({
      where,
      include: {
        category: { select: { name: true, nameUrdu: true } }
      }
    })

    if (records.length === 0) {
      throw new Error('No records found for this person')
    }

    const results = []
    let sent = 0
    let failed = 0
    let skipped = 0

    for (const record of records) {
      try {
        await sendKhidmatWhatsApp(record.id, userId, userRole, ipAddress)
        sent++
        results.push({ 
          recordId: record.id, 
          name: record.name, 
          phone: record.phone,
          status: 'SENT' 
        })
      } catch (error) {
        failed++
        results.push({ 
          recordId: record.id, 
          name: record.name, 
          phone: record.phone,
          status: 'FAILED', 
          error: error.message 
        })
      }
      
      await delay(350)
    }

    await createAuditLog({
      action: 'KHIDMAT_PERSON_WHATSAPP_SENT',
      userId,
      userRole,
      entityType: 'KHIDMAT_RECORD',
      entityId: `person_${cleanPhone}`,
      description: `WhatsApp sent to ${records.length} records for person ${phone}`,
      metadata: { 
        phone: cleanPhone, 
        statusFilter, 
        sent, 
        failed, 
        skipped,
        total: records.length 
      },
      ipAddress
    })

    return { 
      phone: cleanPhone, 
      total: records.length, 
      sent, 
      failed, 
      skipped, 
      results 
    }
  }

  // ============================================================
  // STATS & ANALYTICS
  // ============================================================

  // ─────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────
  async getStats(filters = {}) {
    const { startDate, endDate } = filters
    const dateFilter = (startDate || endDate) ? {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    } : {}

    const baseWhere = { isDeleted: false, ...dateFilter }

    const [totals, byStatus, byCategory] = await Promise.all([
      prisma.khidmatRecord.aggregate({
        where: baseWhere,
        _sum: { amount: true, receivedAmount: true },
        _count: true,
        _avg: { amount: true }
      }),
      prisma.khidmatRecord.groupBy({
        by: ['status'], where: baseWhere,
        _count: true,
        _sum: { amount: true, receivedAmount: true }
      }),
      prisma.khidmatRecord.groupBy({
        by: ['categoryId'], where: baseWhere,
        _count: true,
        _sum: { amount: true, receivedAmount: true }
      })
    ])

    const totalPledged = toNum(totals._sum.amount)
    const totalReceived = toNum(totals._sum.receivedAmount)

    return {
      total: totals._count,
      totalPledged,
      totalReceived,
      totalRemaining: totalPledged - totalReceived,
      averagePledged: totals._avg.amount ? toNum(totals._avg.amount) : 0,
      collectionRate: totalPledged > 0 ? Math.round((totalReceived / totalPledged) * 100) : 0,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        totalPledged: toNum(s._sum.amount),
        totalReceived: toNum(s._sum.receivedAmount)
      })),
      byCategoryId: byCategory.map(c => ({
        categoryId: c.categoryId,
        count: c._count,
        totalPledged: toNum(c._sum.amount),
        totalReceived: toNum(c._sum.receivedAmount)
      }))
    }
  }

  // ─────────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────────
  async getAnalytics(filters = {}) {
    const { startDate, endDate, categoryId } = filters

    const baseWhere = {
      isDeleted: false,
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }),
      ...(categoryId && { categoryId })
    }

    const categoryRaw = await prisma.khidmatRecord.groupBy({
      by: ['categoryId'],
      where: baseWhere,
      _count: true,
      _sum: { amount: true, receivedAmount: true }
    })

    const categoryIds = categoryRaw.map(c => c.categoryId)
    const categories = categoryIds.length > 0
      ? await prisma.donationCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, nameUrdu: true, color: true, icon: true }
      })
      : []

    const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
    const byCategory = categoryRaw.map(row => {
      const pledged = toNum(row._sum.amount)
      const received = toNum(row._sum.receivedAmount)
      return {
        categoryId: row.categoryId,
        name: catMap[row.categoryId]?.name || 'Unknown',
        nameUrdu: catMap[row.categoryId]?.nameUrdu || null,
        color: catMap[row.categoryId]?.color || '#3b82f6',
        icon: catMap[row.categoryId]?.icon || 'Tag',
        count: row._count,
        pledged,
        received,
        remaining: pledged - received,
        collectionRate: pledged > 0 ? Math.round((received / pledged) * 100) : 0
      }
    })

    const conditions = [`"isDeleted" = false`]
    const values = []

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
      month: r.month,
      pledged: Number(r.pledged) || 0,
      received: Number(r.received) || 0,
      remaining: (Number(r.pledged) || 0) - (Number(r.received) || 0),
      count: Number(r.count) || 0
    }))

    return { monthlyTrend, byCategory }
  }

  // ============================================================
  // SCHEDULER OPERATIONS
  // ============================================================

  // ─────────────────────────────────────────────
  // GET SCHEDULES (Fixed - Production Ready)
  // ─────────────────────────────────────────────
  /**
   * Get all reminder schedules with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 20, max: 100)
   * @param {string} options.status - Filter by active status (true/false)
   * @param {string} options.search - Search by name
   * @param {string} options.frequency - Filter by frequency
   * @returns {Promise<Object>} Paginated schedules with metadata
   */
  async getSchedules(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        frequency,
      } = options

      // Validate and sanitize inputs
      const pageNum = Math.max(1, parseInt(page, 10) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))

      // Build where clause
      const where = {}
      
      if (status !== undefined && status !== '') {
        where.isActive = status === 'true' || status === '1'
      }
      
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive'
        }
      }
      
      if (frequency) {
        where.frequency = frequency
      }

      // Execute queries in parallel
      const [schedules, total] = await Promise.all([
        prisma.reminderSchedule.findMany({
          where,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            records: {
              take: 10, // Preview only
              where: { status: 'PENDING' }, // Only show pending records
              include: {
                record: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    status: true,
                    amount: true,
                    receivedAmount: true,
                  }
                }
              }
            },
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            _count: {
              select: {
                records: true // Total records count
              }
            }
          }
        }),
        prisma.reminderSchedule.count({ where })
      ])

      // Transform data - clean and whitelist fields
      const transformedSchedules = schedules.map(({ _count, ...schedule }) => ({
        id: schedule.id,
        name: schedule.name,
        frequency: schedule.frequency,
        time: schedule.time,
        nextRunAt: schedule.nextRunAt,
        lastRunAt: schedule.lastRunAt,
        isActive: schedule.isActive,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        createdBy: schedule.createdByUser ? {
          id: schedule.createdByUser.id,
          name: schedule.createdByUser.name,
          email: schedule.createdByUser.email,
        } : null,
        recordCount: _count.records,
        records: schedule.records.map(r => ({
          id: r.id,
          recordId: r.recordId,
          status: r.status,
          error: r.error,
          sentAt: r.sentAt,
          record: r.record ? {
            id: r.record.id,
            name: r.record.name,
            phone: r.record.phone,
            status: r.record.status,
            amount: r.record.amount ? parseFloat(r.record.amount) : 0,
            receivedAmount: r.record.receivedAmount ? parseFloat(r.record.receivedAmount) : 0,
          } : null
        }))
      }))

      return {
        success: true,
        schedules: transformedSchedules,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }

    } catch (error) {
      console.error('❌ Error fetching schedules:', error)
      throw new Error(`Failed to fetch schedules: ${error.message}`)
    }
  }

 // ─────────────────────────────────────────────
// CREATE SCHEDULE - Updated with time
// ─────────────────────────────────────────────
async createSchedule(data, userId, ipAddress = null) {
  try {
    const { 
      name, 
      frequency, 
      recordIds, 
      isActive = true,
      time = '09:00',
      filterStatuses = ['PARTIAL', 'RECORD_ONLY'],
      filterCategoryId = null
    } = data

    // Validate inputs
    if (!name?.trim()) throw new Error('Name is required')
    if (!frequency) throw new Error('Frequency is required')
    if (!recordIds || recordIds.length === 0) {
      throw new Error('At least one record must be selected')
    }

    // Validate time format
    if (!TIME_REGEX.test(time)) {
      throw new Error('Invalid time format. Use HH:mm (e.g., 09:00)')
    }

    // Validate records exist
    const records = await prisma.khidmatRecord.findMany({
      where: { 
        id: { in: recordIds }, 
        isDeleted: false 
      },
      select: { id: true }
    })

    if (records.length === 0) {
      throw new Error('No valid records found')
    }

    // Calculate next run
    const nextRunAt = this._calculateNextRun({ frequency, time })

    // Create schedule with transaction
    const schedule = await prisma.$transaction(async (tx) => {
      const newSchedule = await tx.reminderSchedule.create({
        data: {
          name: name.trim(),
          frequency,
          time,
          nextRunAt,
          isActive,
          createdBy: userId,
          filterStatuses,
          filterCategoryId,
        }
      })

      // Create schedule records
      await tx.reminderScheduleRecord.createMany({
        data: recordIds.map(recordId => ({
          scheduleId: newSchedule.id,
          recordId,
          status: 'PENDING'
        }))
      })

      return tx.reminderSchedule.findUnique({
        where: { id: newSchedule.id },
        include: {
          records: {
            include: {
              record: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  status: true,
                }
              }
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: { records: true }
          }
        }
      })
    })

    await createAuditLog({
      action: 'REMINDER_SCHEDULE_CREATED',
      userId,
      userRole: 'ADMIN',
      entityType: 'REMINDER_SCHEDULE',
      entityId: schedule.id,
      description: `Created reminder schedule "${schedule.name}" with ${recordIds.length} records`,
      metadata: { 
        name, 
        frequency, 
        time,
        recordCount: recordIds.length 
      },
      ipAddress
    })

    return this._transformSchedule(schedule)

  } catch (error) {
    console.error('❌ Error creating schedule:', error)
    throw new Error(`Failed to create schedule: ${error.message}`)
  }
}

  // ─────────────────────────────────────────────
  // UPDATE SCHEDULE (Fixed - now supports time)
  // ─────────────────────────────────────────────
  async updateSchedule(id, data, userId, ipAddress = null) {
    try {
      // Validate schedule exists
      const existing = await prisma.reminderSchedule.findUnique({
        where: { id },
        include: { records: true }
      })

      if (!existing) {
        throw new Error('Schedule not found')
      }

      // Build update data
      const updateData = {}
      
      if (data.name) updateData.name = data.name.trim()
      if (data.frequency) updateData.frequency = data.frequency
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      // Validate and apply time if provided
      if (data.time !== undefined) {
        if (!TIME_REGEX.test(data.time)) {
          throw new Error('Invalid time format. Use HH:mm (e.g., 09:00)')
        }
        updateData.time = data.time
      }

      // Recalculate nextRunAt if frequency and/or time changed
      if (updateData.frequency || updateData.time) {
        updateData.nextRunAt = this._calculateNextRun({
          frequency: updateData.frequency || existing.frequency,
          time: updateData.time || existing.time,
        })
      }

      // If recordIds provided, update records
      if (data.recordIds) {
        if (data.recordIds.length === 0) {
          throw new Error('At least one record must be selected')
        }

        // Validate records exist
        const records = await prisma.khidmatRecord.findMany({
          where: { id: { in: data.recordIds }, isDeleted: false },
          select: { id: true }
        })

        if (records.length === 0) {
          throw new Error('No valid records found')
        }

        // Update in transaction
        const updated = await prisma.$transaction(async (tx) => {
          // Delete existing records
          await tx.reminderScheduleRecord.deleteMany({
            where: { scheduleId: id }
          })

          // Create new records
          await tx.reminderScheduleRecord.createMany({
            data: data.recordIds.map(recordId => ({
              scheduleId: id,
              recordId,
              status: 'PENDING'
            }))
          })

          // Update schedule
          return tx.reminderSchedule.update({
            where: { id },
            data: updateData,
            include: {
              records: {
                include: {
                  record: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                      status: true,
                    }
                  }
                }
              },
              createdByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              _count: {
                select: { records: true }
              }
            }
          })
        })

        await createAuditLog({
          action: 'REMINDER_SCHEDULE_UPDATED',
          userId,
          userRole: 'ADMIN',
          entityType: 'REMINDER_SCHEDULE',
          entityId: updated.id,
          description: `Updated schedule "${updated.name}"`,
          metadata: { updates: data },
          ipAddress
        })

        return this._transformSchedule(updated)
      }

      // Simple update without records change
      const updated = await prisma.reminderSchedule.update({
        where: { id },
        data: updateData,
        include: {
          records: {
            include: {
              record: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  status: true,
                }
              }
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: { records: true }
          }
        }
      })

      await createAuditLog({
        action: 'REMINDER_SCHEDULE_UPDATED',
        userId,
        userRole: 'ADMIN',
        entityType: 'REMINDER_SCHEDULE',
        entityId: updated.id,
        description: `Updated schedule "${updated.name}"`,
        metadata: { updates: data },
        ipAddress
      })

      return this._transformSchedule(updated)

    } catch (error) {
      console.error('❌ Error updating schedule:', error)
      throw new Error(`Failed to update schedule: ${error.message}`)
    }
  }

  // ─────────────────────────────────────────────
  // DELETE SCHEDULE (Fixed)
  // ─────────────────────────────────────────────
  async deleteSchedule(id, userId, ipAddress = null) {
    try {
      const schedule = await prisma.reminderSchedule.findUnique({
        where: { id },
        select: { id: true, name: true }
      })

      if (!schedule) {
        throw new Error('Schedule not found')
      }

      // Delete with cascade (Prisma handles cascade automatically)
      await prisma.reminderSchedule.delete({
        where: { id }
      })

      await createAuditLog({
        action: 'REMINDER_SCHEDULE_DELETED',
        userId,
        userRole: 'ADMIN',
        entityType: 'REMINDER_SCHEDULE',
        entityId: id,
        description: `Deleted schedule "${schedule.name}"`,
        ipAddress
      })

      return { success: true, message: 'Schedule deleted successfully' }

    } catch (error) {
      console.error('❌ Error deleting schedule:', error)
      throw new Error(`Failed to delete schedule: ${error.message}`)
    }
  }

  // ─────────────────────────────────────────────
  // RUN SCHEDULE (Fixed)
  // ─────────────────────────────────────────────
  async runSchedule(id, userId, userRole, ipAddress = null) {
    try {
      const schedule = await prisma.reminderSchedule.findUnique({
        where: { id },
        include: {
          records: {
            where: { status: 'PENDING' },
            include: { record: true }
          }
        }
      })

      if (!schedule) {
        throw new Error('Schedule not found')
      }

      const recordIds = schedule.records.map(r => r.recordId)

      if (recordIds.length === 0) {
        return { 
          sent: 0, 
          failed: 0, 
          skipped: 0, 
          total: 0,
          message: 'No pending records to send' 
        }
      }

      // Import bulk reminder sender
      const { sendBulkReminders } = await import('../../utils/bulkReminderWhatsApp.js')
      
      const result = await sendBulkReminders({
        recordIds,
        userId,
        userRole,
        ipAddress
      })

      // Update schedule last run
      await prisma.reminderSchedule.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          nextRunAt: this._calculateNextRun(schedule),
        }
      })

      await createAuditLog({
        action: 'REMINDER_SCHEDULE_RUN',
        userId,
        userRole,
        entityType: 'REMINDER_SCHEDULE',
        entityId: id,
        description: `Manual run of schedule "${schedule.name}" completed`,
        metadata: { 
          sent: result.sent, 
          failed: result.failed, 
          total: result.total 
        },
        ipAddress
      })

      return result

    } catch (error) {
      console.error('❌ Error running schedule:', error)
      throw new Error(`Failed to run schedule: ${error.message}`)
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Transform schedule data - whitelist fields and clean structure
   */
  _transformSchedule(schedule) {
    if (!schedule) return null
    
    const { _count, ...rest } = schedule
    
    return {
      id: rest.id,
      name: rest.name,
      frequency: rest.frequency,
      time: rest.time,
      nextRunAt: rest.nextRunAt,
      lastRunAt: rest.lastRunAt,
      isActive: rest.isActive,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt,
      createdBy: rest.createdByUser ? {
        id: rest.createdByUser.id,
        name: rest.createdByUser.name,
        email: rest.createdByUser.email,
      } : null,
      recordCount: _count?.records || 0,
      records: rest.records?.map(r => ({
        id: r.id,
        recordId: r.recordId,
        status: r.status,
        error: r.error,
        sentAt: r.sentAt,
        record: r.record ? {
          id: r.record.id,
          name: r.record.name,
          phone: r.record.phone,
          status: r.record.status,
          amount: r.record.amount ? parseFloat(r.record.amount) : 0,
          receivedAmount: r.record.receivedAmount ? parseFloat(r.record.receivedAmount) : 0,
        } : null
      })) || []
    }
  }

  /**
   * Calculate next run time based on frequency and time-of-day.
   * @param {Object} schedule - Object with `frequency` and optional `time` ("HH:mm", default "09:00")
   */
  _calculateNextRun(schedule) {
    const now = new Date()
    const next = new Date(now)

    // Parse time from schedule (default: 09:00)
    const timeParts = (schedule.time || '09:00').split(':')
    const hours = parseInt(timeParts[0], 10) || 9
    const minutes = parseInt(timeParts[1], 10) || 0

    // Set time of day
    next.setHours(hours, minutes, 0, 0)

    // If that time has already passed today, move to the next occurrence
    if (next <= now) {
      switch (schedule.frequency) {
        case 'DAILY':
          next.setDate(next.getDate() + 1)
          break
        case 'WEEKLY':
          next.setDate(next.getDate() + 7)
          break
        case 'MONTHLY':
          next.setMonth(next.getMonth() + 1)
          break
        case 'CUSTOM':
          next.setDate(next.getDate() + 1)
          break
        default:
          next.setDate(next.getDate() + 1)
      }
    }

    return next
  }
}