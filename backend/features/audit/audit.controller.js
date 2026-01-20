import asyncHandler from 'express-async-handler';
import { getAuditLogs, getLogStats as getLogStatsService } from '../../utils/auditLogger.js';

export const getLogs = asyncHandler(async (req, res) => {
  try {
    const logs = await getAuditLogs(req.query);
    
    res.json({
      success: true,
      ...logs
    });
  } catch (error) {
    console.error('Error in getLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
});

export const getLogStats = asyncHandler(async (req, res) => {
  try {
    // Use the service function instead of re-implementing
    const stats = await getLogStatsService(req.query);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in getLogStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log stats'
    });
  }
});