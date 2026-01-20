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

export const getOperatorStats = asyncHandler(async (req, res) => {
  const stats = await authService.getOperatorStats();
  
  res.json({
    success: true,
    stats
  });
});