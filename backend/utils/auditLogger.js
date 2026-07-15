// ============================================================
// utils/auditLogger.js
// Fixed - Removed debug logging and added proper error handling
// ============================================================

import prisma from '../config/prisma.js';

// Define valid audit actions
const VALID_AUDIT_ACTIONS = {
  // Auth actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  OPERATOR_LOGIN: 'OPERATOR_LOGIN',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  EMAIL_CHANGED: 'EMAIL_CHANGED',
  
  // Donation actions
  DONATION_CREATED: 'DONATION_CREATED',
  DONATION_UPDATED: 'DONATION_UPDATED',
  DONATION_DELETED: 'DONATION_DELETED',
  DONATION_RESTORED: 'DONATION_RESTORED',
  
  // Khidmat actions
  KHIDMAT_CREATED: 'KHIDMAT_CREATED',
  KHIDMAT_UPDATED: 'KHIDMAT_UPDATED',
  KHIDMAT_DELETED: 'KHIDMAT_DELETED',
  KHIDMAT_RESTORED: 'KHIDMAT_RESTORED',
  KHIDMAT_PAYMENT_ADDED: 'KHIDMAT_PAYMENT_ADDED',
  KHIDMAT_WHATSAPP_SENT: 'KHIDMAT_WHATSAPP_SENT',
  KHIDMAT_BULK_REMINDER_SENT: 'KHIDMAT_BULK_REMINDER_SENT',
  KHIDMAT_PERSON_WHATSAPP_SENT: 'KHIDMAT_PERSON_WHATSAPP_SENT',
  
  // Reminder Schedule actions
  REMINDER_SCHEDULE_CREATED: 'REMINDER_SCHEDULE_CREATED',
  REMINDER_SCHEDULE_UPDATED: 'REMINDER_SCHEDULE_UPDATED',
  REMINDER_SCHEDULE_DELETED: 'REMINDER_SCHEDULE_DELETED',
  REMINDER_SCHEDULE_RUN: 'REMINDER_SCHEDULE_RUN',
  REMINDER_SCHEDULE_ERROR: 'REMINDER_SCHEDULE_ERROR',
  REMINDER_SCHEDULE_TEMPLATE_ERROR: 'REMINDER_SCHEDULE_TEMPLATE_ERROR',
  
  // Category actions
  CATEGORY_CREATED: 'CATEGORY_CREATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  CATEGORY_DELETED: 'CATEGORY_DELETED',
  
  // Report actions
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_DOWNLOADED: 'REPORT_DOWNLOADED',
  
  // System actions
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_STARTUP: 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN: 'SYSTEM_SHUTDOWN',
};

export const createAuditLog = async (logData) => {
  try {
    // Validate required fields
    if (!logData.action) {
      console.warn('⚠️ Audit log missing action field');
      return null;
    }

    // Ensure action is valid (fallback to SYSTEM if not found)
    const action = VALID_AUDIT_ACTIONS[logData.action] || 'SYSTEM_ERROR';
    
    // Prepare data for Prisma
    const auditData = {
      action: action,
      entityType: logData.entityType || 'SYSTEM',
      entityId: logData.entityId || 'unknown',
      description: logData.description || `${action} performed`,
      userRole: logData.userRole || 'SYSTEM',
      userId: logData.userId || null,
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      metadata: logData.metadata || {},
      timestamp: new Date()
    };

    // Log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Audit Log: ${action} - ${auditData.description}`);
    }

    // Create audit log in database
    return await prisma.auditLog.create({
      data: auditData
    });

  } catch (error) {
    // Don't crash the app if audit logging fails
    console.error('❌ Audit logging failed:', {
      error: error.message,
      action: logData.action,
      description: logData.description
    });
    
    // In development, log the full error
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    
    return null;
  }
};

export const getAuditLogs = async (filters = {}) => {
  const {
    action,
    userId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50
  } = filters;

  // Convert string values to proper types
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 50;

  const where = {
    ...(action && { action }),
    ...(userId && { userId }),
    ...(startDate || endDate) && {
      timestamp: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    },
    ...(search && {
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (pageInt - 1) * limitInt,
        take: limitInt,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        pages: Math.ceil(total / limitInt)
      }
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

export const getLogStats = async (filters = {}) => {
  const { startDate, endDate } = filters;
  
  const where = {
    ...(startDate || endDate) && {
      timestamp: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    }
  };
  
  try {
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    throw error;
  }
};

// Export valid actions for use in other modules
export { VALID_AUDIT_ACTIONS };