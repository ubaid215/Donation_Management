import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'; 
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';

import config from './config/index.js';
import { connectPrisma, disconnectPrisma } from './config/prisma.js';
import { sanitizeInput } from './middlewares/validation.js';

// Import routes
import authRoutes from './features/auth/auth.route.js';
import donationRoutes from './features/donations/donation.routes.js';
import adminRoutes from './features/admin/admin.routes.js';
import reportRoutes from './features/reports/reports.routes.js';
import auditRoutes from './features/audit/audit.routes.js';
import whatsappTestRoutes from './features/whatsapp/whatsapp-test.route.js';
import webhookRoutes from './routes/webhook.routes.js';

// Import prisma for health check
import prisma from './config/prisma.js'; 

const app = express();

// ========== MIDDLEWARE SETUP - MUST COME FIRST ==========

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...config.security.corsOrigin]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - APPLIED TO ALL ROUTES INCLUDING WEBHOOKS
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow * 60 * 1000,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: ipKeyGenerator
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator
});

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// Compression
app.use(compression({
  level: 6,
  threshold: 100 * 1024
}));

// Request logging
const morganFormat = config.nodeEnv === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  skip: (req) => req.path === '/health'
}));

// Input sanitization
app.use(sanitizeInput);

// Request ID middleware
app.use((req, res, next) => {
  req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  next();
});

// ========== ROUTES ==========

// Webhook routes - NOW WITH CORS APPLIED
app.use('/api/webhook', webhookRoutes);

// Also keep the original path for Meta's webhook calls (no CORS needed)
app.use('/webhook', webhookRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// Apply rate limiting to API routes
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    name: config.appName,
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      donations: '/api/donations',
      admin: '/api/admin',
      reports: '/api/reports',
      audit: '/api/audit'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/whatsapp-test', whatsappTestRoutes);

// ========== ERROR HANDLING ==========

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    error: error.message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    requestId: req.id
  });
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  const response = {
    success: false,
    error: message,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };
  
  if (config.nodeEnv === 'development') {
    response.stack = error.stack;
    response.details = error.details;
  }
  
  if (error.name === 'ValidationError') {
    response.error = 'Validation failed';
    response.details = error.errors;
  }
  
  if (error.name === 'PrismaClientKnownRequestError') {
    response.error = 'Database error occurred';
    if (config.nodeEnv !== 'development') {
      response.error = 'An error occurred while processing your request';
    }
  }
  
  res.status(statusCode).json(response);
});

// ========== SERVER STARTUP ==========

const startServer = async () => {
  try {
    await connectPrisma();
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📡 CORS Origins: ${config.security.corsOrigin.join(', ')}`);
      console.log(`🕐 Time: ${new Date().toLocaleString()}`);
      console.log(`🔗 Health Check: http://localhost:${config.port}/health`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api`);
      console.log(`🔗 Webhook URL: http://localhost:${config.port}/webhook/whatsapp`);
    });
    
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        await disconnectPrisma();
        console.log('Graceful shutdown completed');
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('🔥 Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;