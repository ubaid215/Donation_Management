import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Validate JWT config on import
if (!config.jwt.secret || config.jwt.secret.includes('your-super-secret')) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set or using default value');
  console.warn('⚠️  Please set JWT_SECRET in your .env file');
  console.warn('⚠️  For development, you can use:');
  console.warn('⚠️  JWT_SECRET=your-development-secret-key-minimum-32-characters-long');
}

export const generateToken = (userId, role) => {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is not configured. Please check your .env file');
  }
  
  return jwt.sign(
    { 
      userId, 
      role,
      iat: Math.floor(Date.now() / 1000) // Issued at timestamp
    },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.accessExpiry,
      algorithm: 'HS256'
    }
  );
};

export const verifyToken = (token) => {
  try {
    if (!config.jwt.secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch (error) {
    // Provide specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    }
    
    throw new Error('Token verification failed');
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('JWT decode error:', error.message);
    throw new Error('Failed to decode token');
  }
};

// Helper to validate JWT configuration
export const validateJWTConfig = () => {
  if (!config.jwt.secret) {
    console.error('❌ JWT_SECRET is not set in environment variables');
    return false;
  }
  
  if (config.jwt.secret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is too short (minimum 32 characters recommended)');
  }
  
  if (config.jwt.secret.includes('your-super-secret') || 
      config.jwt.secret.includes('change-in-production')) {
    console.warn('⚠️  WARNING: You are using a placeholder JWT_SECRET. Change it in production!');
  }
  
  console.log('✅ JWT configuration loaded successfully');
  console.log(`   Expiry: ${config.jwt.accessExpiry}`);
  console.log(`   Secret length: ${config.jwt.secret.length} characters`);
  
  return true;
}