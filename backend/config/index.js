import dotenv from 'dotenv';

dotenv.config();

export default {
  // Server Configuration
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Application
  appName: process.env.APP_NAME || 'Donation Management System',
  appUrl: process.env.APP_URL || 'http://localhost:3001',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Email (Resend)
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'donations@yourorg.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Donation System',
    adminEmail: process.env.ADMIN_EMAIL,
    defaultSender: process.env.EMAIL_DEFAULT_SENDER || 'Your Organization <donations@yourorg.com>'
  },

  // WhatsApp
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
  },

  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    tokenBlacklistEnabled: process.env.TOKEN_BLACKLIST_ENABLED === 'true',
  },

  // Upload Limits
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIRECTORY || './logs',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
  },

  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 120,
  },
};