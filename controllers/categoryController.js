const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Category } = require('../models');

// POST /api/categories — Admin only (Module 4)
const createCategory = asyncHandler(async (req, res) => {
  const { name, parentCategoryId } = req.body;

  if (parentCategoryId) {
    const parent = await Category.findById(parentCategoryId);
    if (!parent) throw new AppError('Parent category not found', 404, errorCodes.NOT_FOUND);
  }

  const category = await Category.create({ name, parentCategoryId: parentCategoryId || null });
  return success(res, 201, 'Category created', { category });
});

// GET /api/categories — public, returns full hierarchy (flat list; client nests by parentCategoryId)
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return success(res, 200, 'Categories fetched', { categories });
});

// GET /api/categories/:id
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND);
  return success(res, 200, 'Category fetched', { category });
});

// PUT /api/categories/:id — Admin only
const updateCategory = asyncHandler(async (req, res) => {
  if (req.body.parentCategoryId === req.params.id) {
    throw new AppError('A category cannot be its own parent', 400, errorCodes.VALIDATION_ERROR);
  }

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND);
  return success(res, 200, 'Category updated', { category });
});

// DELETE /api/categories/:id — Admin only; block deletion if children or products reference it
const deleteCategory = asyncHandler(async (req, res) => {
  const { Product } = require('../models');

  const hasChildren = await Category.exists({ parentCategoryId: req.params.id });
  if (hasChildren) {
    throw new AppError('Cannot delete a category that has sub-categories', 409, errorCodes.CONFLICT);
  }
  const hasProducts = await Product.exists({ categoryId: req.params.id });
  if (hasProducts) {
    throw new AppError('Cannot delete a category that still has products', 409, errorCodes.CONFLICT);
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND);
  return success(res, 200, 'Category deleted', {});
});

module.exports = { createCategory, listCategories, getCategory, updateCategory, deleteCategory };
