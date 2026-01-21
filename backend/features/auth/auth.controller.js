import asyncHandler from 'express-async-handler';
import { AuthService } from './auth.service.js'; 

const authService = new AuthService();

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login(email, password);
  
  res.json({
    success: true,
    ...result
  });
});

export const verify = asyncHandler(async (req, res) => {
  const result = await authService.verifyToken(req.user.id);
  
  res.json({
    success: true,
    ...result
  });
});

export const createOperator = asyncHandler(async (req, res) => {
  console.log('=== CREATE OPERATOR REQUEST START ===');
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Authenticated User ID:', req.user?.id);
  console.log('Authenticated User Role:', req.user?.role);
  console.log('=== CREATE OPERATOR REQUEST END ===');
  
  try {
    const operator = await authService.createOperator(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Operator created successfully',
      operator
    });
  } catch (error) {
    console.error('=== CREATE OPERATOR ERROR ===');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Request Body that caused error:', req.body);
    console.error('=== CREATE OPERATOR ERROR END ===');
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export const getOperators = asyncHandler(async (req, res) => {
  const result = await authService.getOperators(req.query);
  
  res.json({
    success: true,
    ...result
  });
});

export const updateOperator = asyncHandler(async (req, res) => {
  const operator = await authService.updateUser(req.params.id, req.body, req.user.id);
  
  res.json({
    success: true,
    message: 'Operator updated successfully',
    operator
  });
});

// 👤 Update profile controller
export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// for admin
export const changeEmail = asyncHandler(async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    
    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Only allow admins to change email
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can change email addresses'
      });
    }
    
    const result = await authService.changeEmail(
      req.user.id,
      newEmail,
      currentPassword
    );
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change email error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 🔐 Change password controller
export const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const result = await authService.requestPasswordReset(email);
  
  res.status(200).json({
    success: true,
    message: result.message || 'If your email exists, you will receive a reset link shortly.'
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }
  
  const result = await authService.resetPassword(token, password);
  
  res.status(200).json({
    success: true,
    message: result.message || 'Password reset successful. You can now login with your new password.'
  });
});

export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Reset token is required'
    });
  }
  
  const result = await authService.verifyResetToken(token);
  
  res.status(200).json({
    success: true,
    valid: result.valid,
    email: result.email,
    message: result.message
  });
});

export const getOperatorStats = asyncHandler(async (req, res) => {
  const stats = await authService.getOperatorStats();
  
  res.json({
    success: true,
    stats
  });
});