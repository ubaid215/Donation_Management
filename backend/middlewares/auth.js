import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { createAuditLog } from '../utils/auditLogger.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    // Update last login on first request of the day
    const today = new Date().toDateString();
    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toDateString() : null;
    
    if (today !== lastLoginDate) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      
      // Log login
      await createAuditLog({
        action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'OPERATOR_LOGIN',
        userId: user.id,
        userRole: user.role,
        entityType: 'USER',
        entityId: user.id,
        description: `${user.role} logged in`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnlyMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const operatorScopeMiddleware = async (req, res, next) => {
  if (req.user.role === 'OPERATOR') {
    // Operators can only access their own data
    if (req.params.id || req.body.operatorId) {
      const resourceId = req.params.id || req.body.operatorId;
      
      // For donations, verify operator owns the record
      if (req.baseUrl.includes('donations')) {
        const donation = await prisma.donation.findUnique({
          where: { id: resourceId },
          select: { operatorId: true }
        });
        
        if (!donation || donation.operatorId !== req.user.id) {
          return res.status(403).json({ error: 'Access denied to this resource' });
        }
      }
    }
    
    // Always filter donations by operatorId for operators
    if (req.method === 'GET' && req.baseUrl.includes('donations')) {
      req.query.operatorId = req.user.id;
    }
  }
  next();
};