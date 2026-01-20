import prisma from '../../config/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { sendEmailNotification } from '../../utils/notification.js'; // Added .js extension

export class AuthService {
  constructor() {
    this.prisma = prisma;
  }

  async login(email, password) {
  console.log('[AuthService.login] Login attempt started', { email });

  // 1️⃣ Find user
  const user = await this.prisma.user.findUnique({
    where: { email, isActive: true },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
      lastLogin: true
    }
  });

  console.log('[AuthService.login] User fetch result', {
    found: !!user,
    userId: user?.id
  });

  if (!user) {
    console.error('[AuthService.login] User not found or inactive', { email });
    throw new Error('Invalid credentials');
  }

  // 2️⃣ Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  console.log('[AuthService.login] Password verification', {
    userId: user.id,
    isValid
  });

  if (!isValid) {
    console.error('[AuthService.login] Invalid password', { userId: user.id });
    throw new Error('Invalid credentials');
  }

  // 3️⃣ Update last login
  await this.prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  console.log('[AuthService.login] Last login updated', {
    userId: user.id
  });

  // 4️⃣ Generate token
  console.log('[AuthService.login] Generating JWT token', {
    userId: user.id,
    role: user.role,
    jwtSecretExists: !!process.env.JWT_SECRET
  });

  const token = generateToken(user.id, user.role);

  console.log('[AuthService.login] JWT token generated successfully', {
    userId: user.id
  });

  // 5️⃣ Remove password hash
  const { passwordHash, ...userWithoutPassword } = user;

  console.log('[AuthService.login] Login successful', {
    userId: user.id
  });

  return {
    token,
    user: userWithoutPassword
  };
}


 async createOperator(operatorData, adminId) {
  console.log('=== AUTH SERVICE: CREATE OPERATOR ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Admin ID:', adminId);
  console.log('Operator Data Received:', {
    name: operatorData?.name,
    email: operatorData?.email,
    phone: operatorData?.phone,
    password: operatorData?.password ? '[PROTECTED]' : 'MISSING',
    passwordLength: operatorData?.password?.length
  });

  // Validate input
  console.log('Validating input...');
  
  // Check for null/undefined operatorData
  if (!operatorData) {
    console.error('ERROR: operatorData is null or undefined');
    throw new Error('Operator data is required');
  }

  // Validate required fields
  const requiredFields = ['name', 'email', 'password', 'phone'];
  const missingFields = requiredFields.filter(field => {
    const value = operatorData[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    console.error('ERROR: Missing required fields:', missingFields);
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  console.log('All required fields present');
  
  // Validate email format
  console.log('Validating email format...');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(operatorData.email)) {
    console.error('ERROR: Invalid email format:', operatorData.email);
    throw new Error('Invalid email format');
  }
  console.log('Email format valid');

  // Validate password
  console.log('Validating password...');
  if (operatorData.password.length < 6) {
    console.error('ERROR: Password too short:', operatorData.password.length);
    throw new Error('Password must be at least 6 characters');
  }
  console.log('Password length valid');

  // 1️⃣ Check if email already exists
  console.log('Checking if email already exists:', operatorData.email);
  
  try {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: operatorData.email }
    });

    if (existingUser) {
      console.warn('EMAIL ALREADY EXISTS:', {
        email: operatorData.email,
        existingUserId: existingUser.id,
        existingUserName: existingUser.name
      });
      throw new Error('Email already registered');
    }

    console.log('Email is unique - no existing user found');
    
    // 2️⃣ Hash password
    console.log('Hashing password...');
    const passwordHash = await hashPassword(operatorData.password);
    
    if (!passwordHash) {
      console.error('ERROR: Password hashing failed');
      throw new Error('Password hashing failed');
    }
    console.log('Password hashed successfully');

    // 3️⃣ Transaction start
    console.log('Starting database transaction...');
    
    let operator;
    try {
      operator = await this.prisma.$transaction(async (tx) => {
        console.log('[TRANSACTION] Creating operator user...');
        
        const newOperator = await tx.user.create({
          data: {
            name: operatorData.name,
            email: operatorData.email,
            phone: operatorData.phone,
            passwordHash,
            role: 'OPERATOR',
            isActive: true
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
          }
        });

        console.log('[TRANSACTION] User created:', {
          id: newOperator.id,
          email: newOperator.email,
          name: newOperator.name
        });

        console.log('[TRANSACTION] Creating audit log...');
        await createAuditLog({
          action: 'USER_CREATED',
          userId: adminId,
          userRole: 'ADMIN',
          entityType: 'USER',
          entityId: newOperator.id,
          description: `Operator ${newOperator.name} created by admin`,
          metadata: {
            operatorEmail: newOperator.email,
            operatorName: newOperator.name
          }
        });
        console.log('[TRANSACTION] Audit log created');

        return newOperator;
      });

      console.log('Transaction committed successfully');
      
    } catch (transactionError) {
      console.error('TRANSACTION ERROR:', transactionError);
      console.error('Transaction error code:', transactionError.code);
      console.error('Transaction error message:', transactionError.message);
      console.error('Transaction error meta:', transactionError.meta);
      throw transactionError;
    }

    // 4️⃣ Send welcome email
    console.log('Attempting to send welcome email...');
    try {
      await sendEmailNotification({
        to: operator.email,
        subject: 'Welcome to Donation Management System',
        html: `
          <h2>Welcome ${operator.name}!</h2>
          <p>Your operator account has been created successfully.</p>
          <p>You can now login and start recording donations.</p>
          <p><strong>Login Email:</strong> ${operator.email}</p>
          <br>
          <p>Best regards,<br>Administration Team</p>
        `
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message);
      // Don't fail operator creation if email fails
    }

    console.log('=== AUTH SERVICE: CREATE OPERATOR COMPLETED SUCCESSFULLY ===');
    return operator;
    
  } catch (error) {
    console.error('=== AUTH SERVICE: CREATE OPERATOR FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      console.error('PRISMA UNIQUE CONSTRAINT ERROR:', {
        code: error.code,
        meta: error.meta
      });
      throw new Error('Email address already exists');
    }
    
    throw error;
  }
}


  async updateUser(userId, updateData, adminId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updatePayload = {};
      
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.phone) updatePayload.phone = updateData.phone;
      if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
      
      const updated = await tx.user.update({
        where: { id: userId },
        data: updatePayload,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      // Log the action
      await createAuditLog({
        action: 'USER_UPDATED',
        userId: adminId,
        userRole: 'ADMIN',
        entityType: 'USER',
        entityId: userId,
        description: `User ${user.name} updated by admin`,
        metadata: {
          changes: updateData,
          previousStatus: user.isActive
        }
      });

      return updated;
    });

    return updatedUser;
  }

  async getOperators(filters = {}) {
  const { 
    isActive,
    search,
    page = 1,
    limit = 20
  } = filters;

  // Convert to integers
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 20;

  // Build where clause
  const where = {
    role: 'OPERATOR',
  };

  // Handle isActive filter 
  if (isActive !== undefined && isActive !== '') {
    // Convert string to boolean
    const isActiveBool = isActive === 'true' || isActive === '1';
    where.isActive = isActiveBool;
  }

  // Handle search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [operators, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageInt - 1) * limitInt,
      take: limitInt,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            donations: true
          }
        }
      }
    }),
    this.prisma.user.count({ where })
  ]);

  return {
    operators,
    pagination: {
      page: pageInt,
      limit: limitInt,
      total,
      pages: Math.ceil(total / limitInt)
    }
  };
}

  async getOperatorStats() {
    const [
      totalOperators,
      activeOperators,
      operatorsByActivity
    ] = await Promise.all([
      // Total operators
      this.prisma.user.count({ where: { role: 'OPERATOR' } }),
      
      // Active operators (logged in last 7 days)
      this.prisma.user.count({
        where: {
          role: 'OPERATOR',
          isActive: true,
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Operators with donation counts
      this.prisma.user.findMany({
        where: { role: 'OPERATOR', isActive: true },
        select: {
          id: true,
          name: true,
          lastLogin: true,
          _count: {
            select: { donations: true }
          }
        },
        orderBy: {
          donations: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);

    return {
      totalOperators,
      activeOperators,
      operatorsByActivity
    };
  }

  async verifyToken(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true
      }
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    return { user };
  }
}