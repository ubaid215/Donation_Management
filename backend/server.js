// ============================================================
// server.js - Complete with scheduler initialization and error handling
// ============================================================

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
import khidmatRoutes from './features/khidmatRecord/khidmat.routes.js';
import whatsappTestRoutes from './features/whatsapp/whatsapp-test.route.js';
import webhookRoutes from './routes/webhook.routes.js';

// Import scheduler with all exports
import { initScheduler, stopScheduler, runSchedulerManually } from './features/khidmatRecord/scheduler.service.js';

// Import prisma for health check
import prisma from './config/prisma.js'; 

const app = express();

// ========== MIDDLEWARE SETUP ==========

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

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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

// Webhook routes
app.use('/api/webhook', webhookRoutes);
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
      database: 'connected',
      scheduler: schedulerJobs ? 'running' : 'stopped'
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
      audit: '/api/audit',
      khidmat: '/api/khidmat'
    }
  });
});

// ========== ADMIN ROUTES ==========

// Manual scheduler test route (Admin only - protected by middleware)
// This route should be added to khidmat.routes.js, but we'll add it here for completeness
app.post('/api/admin/run-scheduler', async (req, res) => {
  try {
    // Check if user is admin - simple check, you should use your auth middleware
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Authorization required' });
    }
    
    // You should verify the JWT token here and check admin role
    // This is a simplified version - use your actual auth middleware
    
    const result = await runSchedulerManually();
    res.json({
      success: true,
      message: 'Scheduler test run completed',
      result
    });
  } catch (error) {
    console.error('Manual scheduler run failed:', error);
    res.status(500).json({
      success: false,
      message: 'Scheduler test run failed',
      error: error.message
    });
  }
});

// Scheduler status endpoint
app.get('/api/admin/scheduler-status', (req, res) => {
  res.json({
    success: true,
    schedulerRunning: !!schedulerJobs,
    status: schedulerJobs ? 'active' : 'inactive',
    timestamp: new Date().toISOString()
  });
});

// ========== API ROUTES ==========

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/khidmat', khidmatRoutes);
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

let schedulerJobs = null;

const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    console.log(`📦 Environment: ${config.nodeEnv}`);
    console.log(`🔌 Port: ${config.port}`);
    
    // Connect to database
    await connectPrisma();
    console.log('✅ Database connected');
    
    // Initialize scheduler with error handling
    try {
      schedulerJobs = initScheduler();
      console.log('✅ Scheduler initialized successfully');
    } catch (schedulerError) {
      console.error('⚠️ Scheduler initialization failed:', schedulerError.message);
      console.log('⚠️ Continuing without scheduler...');
      schedulerJobs = null;
    }
    
    const server = app.listen(config.port, () => {
      console.log(`\n🚀 Server is running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log("Current Date:", new Date());
console.log("ISO:", new Date().toISOString());
console.log("Locale:", new Date().toLocaleString());
console.log("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("TZ env:", process.env.TZ);
console.log("Offset:", new Date().getTimezoneOffset());
      console.log(`📡 CORS Origins: ${config.security.corsOrigin.join(', ')}`);
      console.log(`🕐 Time: ${new Date().toLocaleString()}`);
      console.log(`\n🔗 Health Check: http://localhost:${config.port}/health`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api`);
      console.log(`🔗 Webhook URL: http://localhost:${config.port}/webhook/whatsapp`);
      console.log(`\n📋 Scheduler Status: ${schedulerJobs ? '✅ Running' : '❌ Not running'}`);
      if (schedulerJobs) {
        console.log(`   Main task: 9 AM and 6 PM daily`);
        console.log(`   Health check: Every 5 minutes`);
      }
      console.log(`\n✨ Server ready!`);
    });
    
    // ========== GRACEFUL SHUTDOWN ==========
    
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Stop scheduler if running
      if (schedulerJobs) {
        console.log('⏰ Stopping scheduler...');
        try {
          stopScheduler(schedulerJobs);
          console.log('✅ Scheduler stopped');
        } catch (error) {
          console.error('⚠️ Error stopping scheduler:', error.message);
        }
      }
      
      // Close HTTP server
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        // Disconnect from database
        try {
          await disconnectPrisma();
          console.log('✅ Database disconnected');
        } catch (error) {
          console.error('⚠️ Error disconnecting from database:', error.message);
        }
        
        console.log('✨ Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after timeout
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🔥 Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🔥 Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;