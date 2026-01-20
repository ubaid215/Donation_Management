import { createAuditLog } from '../utils/auditLogger.js';



export const auditReportExport = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Log PDF export
      if (req.originalUrl.includes('/reports/pdf')) {
        createAuditLog({
          action: 'PDF_EXPORTED',
          userId: req.user.id,
          userRole: req.user.role,
          entityType: 'REPORT',
          description: 'PDF report exported',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            filters: req.query,
            reportType: 'donations'
          }
        });
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};