import prisma from '../../config/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { sendEmailNotification } from '../../utils/notification.js'; 
import crypto from 'crypto';

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
          <p><strong>Login password:</strong> ${operator.password}</p>
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

  async requestPasswordReset(email) {
  console.log('[AuthService.requestPasswordReset] Initiated', { email });

  // 1️⃣ Find user WITHOUT revealing if they exist (security best practice)
  const user = await this.prisma.user.findUnique({
    where: { email, isActive: true },
    select: { id: true, email: true, name: true, role: true }
  });

  
  if (!user) {
    console.warn('[PasswordReset] Email not found or inactive', { email });
    // Still return success to user (security best practice)
    return { success: true, message: 'If email exists, reset link sent' };
  }

  // 2️⃣ Generate secure reset token
  const rawToken = crypto.randomBytes(32).toString('hex'); // 64-character token
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // 3️⃣ Set expiry (15 minutes from now)
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  // 4️⃣ Store hashed token and expiry in database
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: expiry
    }
  });

  // 5️⃣ Create reset link (frontend URL + token)
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  // 6️⃣ Send email
  try {
    await sendEmailNotification({
      to: user.email,
      subject: 'Reset Your Password - Donation Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You recently requested to reset your password for your Donation Management System account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email or contact support.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Security Tip: Never share your password or this reset link with anyone.
          </p>
        </div>
      `
    });
    console.log('[PasswordReset] Reset email sent', { userId: user.id });
  } catch (emailError) {
    console.error('[PasswordReset] Failed to send email:', emailError.message);
    // Don't throw error - user shouldn't know if email failed
  }

  // 7️⃣ Create audit log
  await createAuditLog({
    action: 'PASSWORD_RESET_REQUESTED',
    userId: user.id,
    userRole: user.role,
    entityType: 'USER',
    entityId: user.id,
    description: 'User requested password reset',
    metadata: {
      email: user.email,
      tokenGeneratedAt: new Date().toISOString()
    }
  });

  return { 
    success: true, 
    message: 'If your email exists in our system, you will receive a reset link.' 
  };
}


// Add these methods to AuthService class

// 👤 Update profile (for logged-in user)
async updateProfile(userId, profileData) {
  console.log('[AuthService.updateProfile] Updating profile for user:', userId);
  
  // Validate input
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { name, phone } = profileData;
  
  // Build update payload
  const updatePayload = {};
  if (name !== undefined) {
    if (name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    updatePayload.name = name.trim();
  }
  
  if (phone !== undefined) {
    // Basic phone validation
    if (phone.trim().length < 5) {
      throw new Error('Please enter a valid phone number');
    }
    updatePayload.phone = phone.trim();
  }

  // Check if there's anything to update
  if (Object.keys(updatePayload).length === 0) {
    throw new Error('No valid fields to update');
  }

  try {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId, isActive: true },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    // Create audit log
    await createAuditLog({
      action: 'USER_UPDATED',
      userId: userId,
      userRole: updatedUser.role,
      entityType: 'USER',
      entityId: userId,
      description: 'User updated their profile',
      metadata: {
        changes: updatePayload
      }
    });

    console.log('[AuthService.updateProfile] Profile updated successfully', {
      userId,
      changes: updatePayload
    });

    return updatedUser;
    
  } catch (error) {
    console.error('[AuthService.updateProfile] Failed:', error);
    
    if (error.code === 'P2025') {
      throw new Error('User not found or inactive');
    }
    
    throw error;
  }
};

// Add this method to your backend AuthService class
async changeEmail(userId, newEmail, currentPassword) {
  console.log('[AuthService.changeEmail] Changing email for user:', userId);
  
  if (!userId || !newEmail || !currentPassword) {
    throw new Error('All fields are required');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new Error('Please enter a valid email address');
  }

  // Get user with password hash
  const user = await this.prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      name: true
    }
  });

  if (!user) {
    throw new Error('User not found or inactive');
  }

  // Check if new email is different
  if (user.email === newEmail) {
    throw new Error('New email must be different from current email');
  }

  // Check if email already exists
  const existingUser = await this.prisma.user.findUnique({
    where: { email: newEmail }
  });

  if (existingUser) {
    throw new Error('Email address already exists');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  try {
    await this.prisma.$transaction(async (tx) => {
      // Update email
      await tx.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'EMAIL_CHANGED',
          entityType: 'USER',
          entityId: userId,
          description: 'User changed their email address',
          userRole: user.role,
          userId: userId,
          metadata: {
            oldEmail: user.email,
            newEmail: newEmail,
            changedAt: new Date().toISOString()
          },
          timestamp: new Date()
        }
      });
    });

    // Send email notification to old email
    try {
      await sendEmailNotification({
        to: user.email,
        subject: 'Email Address Changed - Donation Management System',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>Email Address Changed</h3>
            <p>Your email address has been changed from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.</p>
            <p>You will need to use your new email address to login.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.warn('[AuthService.changeEmail] Old email notification failed:', emailError.message);
    }

    // Send email notification to new email
    try {
      await sendEmailNotification({
        to: newEmail,
        subject: 'Welcome to Your New Email - Donation Management System',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>Email Address Updated Successfully</h3>
            <p>Your email address has been successfully changed to this address.</p>
            <p>You can now use <strong>${newEmail}</strong> to login to your account.</p>
            <p>If you did not request this change, please contact support immediately.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.warn('[AuthService.changeEmail] New email notification failed:', emailError.message);
    }

    console.log('[AuthService.changeEmail] Email changed successfully', {
      userId,
      oldEmail: user.email,
      newEmail
    });

    return { 
      success: true, 
      message: 'Email address changed successfully. Please login with your new email.' 
    };
    
  } catch (error) {
    console.error('[AuthService.changeEmail] Failed:', error);
    throw new Error('Failed to change email address');
  }
}

// 🔐 Change password (for logged-in user)
async changePassword(userId, currentPassword, newPassword) {
  console.log('[AuthService.changePassword] Changing password for user:', userId);
  
  if (!userId || !currentPassword || !newPassword) {
    throw new Error('All fields are required');
  }

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }

  // Get user with password hash
  const user = await this.prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true
    }
  });

  if (!user) {
    throw new Error('User not found or inactive');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  try {
    await this.prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'PASSWORD_CHANGED',
          entityType: 'USER',
          entityId: userId,
          description: 'User changed their password',
          userRole: user.role,
          userId: userId,
          metadata: {
            changedAt: new Date().toISOString(),
            email: user.email
          },
          timestamp: new Date()
        }
      });
    });

    // Send email notification
    try {
      await sendEmailNotification({
        to: user.email,
        subject: 'Password Changed - Donation Management System',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>Password Changed Successfully</h3>
            <p>Your password has been changed successfully.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Security Tip: If you suspect any unauthorized access, please reset your password immediately.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.warn('[AuthService.changePassword] Email notification failed:', emailError.message);
    }

    console.log('[AuthService.changePassword] Password changed successfully', {
      userId
    });

    return { success: true, message: 'Password changed successfully' };
    
  } catch (error) {
    console.error('[AuthService.changePassword] Failed:', error);
    throw new Error('Failed to change password');
  }
}



// Add this method to AuthService class
async verifyResetToken(token) {
  console.log('[AuthService.verifyResetToken] Verifying token');
  
  if (!token) {
    return { valid: false, message: 'Token is required' };
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await this.prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: {
        gte: new Date()
      },
      isActive: true
    },
    select: {
      email: true,
      name: true
    }
  });

  if (!user) {
    return { 
      valid: false, 
      message: 'Invalid or expired reset token' 
    };
  }

  return { 
    valid: true, 
    email: user.email,
    message: 'Token is valid'
  };
}

// Add this method to AuthService class
async resetPassword(token, password) {
  console.log('[AuthService.resetPassword] Attempt');

  if (!token || !password) {
    throw new Error('Reset token and new password are required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await this.prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: {
        gte: new Date()
      },
      isActive: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true
    }
  });

  if (!user) {
    console.error('[PasswordReset] Invalid or expired token');
    throw new Error('Invalid or expired reset link. Please request a new one.');
  }

  // Check if new password is same as old
  const isSamePassword = await verifyPassword(password, user.passwordHash);
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }

  const passwordHash = await hashPassword(password);

  try {
    // 🔧 FIX: Do everything in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      console.log('[PasswordReset] Starting transaction...');
      
      // 1. Update user password and clear reset fields
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
          updatedAt: new Date()
        }
      });

      console.log('[PasswordReset] User password updated');

      // 2. Create audit log INSIDE the transaction
      const auditLog = await tx.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_COMPLETED',
          entityType: 'USER',
          entityId: user.id,
          description: 'User successfully reset password',
          userRole: user.role,
          userId: user.id,
          metadata: {
            resetCompletedAt: new Date().toISOString(),
            email: user.email
          },
          timestamp: new Date()
        }
      });

      console.log('[PasswordReset] Audit log created inside transaction:', auditLog.id);

      return { updatedUser, auditLog };
    }, {
      maxWait: 10000, // Increase wait time
      timeout: 10000  // Increase timeout to 10 seconds
    });

    console.log('[PasswordReset] Transaction completed successfully');

    // 3. Send confirmation email (OUTSIDE transaction to avoid timeout)
    try {
      await sendEmailNotification({
        to: user.email,
        subject: 'Password Reset Successful',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>Password Reset Confirmation</h3>
            <p>Your password has been successfully reset.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
          </div>
        `
      });
      console.log('[PasswordReset] Confirmation email sent');
    } catch (emailError) {
      console.warn('[PasswordReset] Confirmation email failed:', emailError.message);
      // Don't fail the reset if email fails
    }

    console.log('[PasswordReset] Password reset successful', {
      userId: user.id
    });

    return { 
      success: true, 
      message: 'Password reset successful. You can now login with your new password.' 
    };

  } catch (transactionError) {
    console.error('[PasswordReset] Transaction failed:', transactionError);
    
    // Handle specific transaction timeout error
    if (transactionError.code === 'P2028') {
      throw new Error('Reset operation timed out. Please try again.');
    }
    
    throw new Error('Failed to reset password. Please try again.');
  }
}

}