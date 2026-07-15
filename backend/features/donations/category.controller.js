import asyncHandler from 'express-async-handler';
import { DonationCategoryService } from './category.service.js';

const categoryService = new DonationCategoryService();

export const createCategory = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const category = await categoryService.createCategory(
    req.body,
    req.user.id,
    ipAddress
  );

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category
  });
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getAllCategories(req.query);

  res.json({
    success: true,
    ...result
  });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.json({
    success: true,
    category
  });
});

export const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getActiveCategories();
  
  res.json({
    success: true,
    categories
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
<<<<<<< ours
  const ipAddress = req.ip || req.connection.remoteAddress;
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
    req.user.id,
    ipAddress
  );

  res.json({
    success: true,
    message: 'Category updated successfully',
    category
  });
=======
  console.log("========== UPDATE CATEGORY ==========");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("User:", req.user);

  const ipAddress = req.ip || req.connection.remoteAddress;
  console.log("IP Address:", ipAddress);

  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.user.id,
      ipAddress
    );

    console.log("Category updated successfully:", category);

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full Error:", error);

    throw error; // Let asyncHandler handle the response
  }
>>>>>>> theirs
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  await categoryService.deleteCategory(req.params.id, req.user.id, ipAddress);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const category = await categoryService.toggleCategoryStatus(
    req.params.id,
    req.user.id,
    ipAddress
  );

  res.json({
    success: true,
    message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
    category
  });
});

export const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await categoryService.getCategoryStats(req.params.id);

  res.json({
    success: true,
    stats
  });
});