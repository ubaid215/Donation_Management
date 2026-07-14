import prisma from '../config/prisma.js';

export const createAuditLog = async (logData) => {
  try {
    // ADD DEBUG LOGGING
    console.log('📝 CREATE AUDIT LOG CALLED:');
    console.log('Description:', logData.description);
    console.log('Action:', logData.action);
    console.log('Call stack (first 3 lines):');
    const stack = new Error().stack;
    console.log(stack.split('\n').slice(0, 4).join('\n')); // Show caller
    console.log('---');
    
    return await prisma.auditLog.create({
      data: {
        action: logData.action,
        entityType: logData.entityType || 'SYSTEM',
        entityId: logData.entityId,
        description: logData.description,
        userRole: logData.userRole,
        userId: logData.userId,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        metadata: logData.metadata || {},
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
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
        take: limitInt, // Now an integer, not a string
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

// Add this function to auditLogger.js
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
