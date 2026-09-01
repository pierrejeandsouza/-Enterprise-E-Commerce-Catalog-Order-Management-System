const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Product, Category } = require('../models');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// POST /api/products — Seller adds a product (Module 3)
const createProduct = asyncHandler(async (req, res) => {
  if (req.user.role === 'seller') {
    const { User } = require('../models');
    const seller = await User.findById(req.user.id);
    if (!seller.isApprovedSeller) {
      throw new AppError('Your seller account is pending admin approval', 403, errorCodes.FORBIDDEN);
    }
  }

  const category = await Category.findById(req.body.categoryId);
  if (!category) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND);

  const product = await Product.create({ ...req.body, sellerId: req.user.id });
  return success(res, 201, 'Record created successfully', { _id: product._id, product });
});

// GET /api/products — Module 5: search, filter, paginate (public)
const listProducts = asyncHandler(async (req, res) => {
  const { keyword, categoryId, minPrice, maxPrice, minRating, sellerId, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { isActive: true };
  if (keyword) filter.$text = { $search: keyword };
  if (categoryId) filter.categoryId = categoryId;
  if (sellerId) filter.sellerId = sellerId;
  if (minRating) filter.ratingAvg = { $gte: Number(minRating) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating_desc: { ratingAvg: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const [products, totalCount] = await Promise.all([
    Product.find(filter).sort(sortBy).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return success(res, 200, 'Products fetched', {
    products,
    pagination: buildPaginationMeta(page, limit, totalCount),
  });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND);
  return success(res, 200, 'Product fetched', { product });
});

// PUT /api/products/:id — Seller (own product) or Admin (Module 3)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND);

  const isOwner = product.sellerId.toString() === req.user.id;
  if (req.user.role === 'seller' && !isOwner) {
    throw new AppError('You can only update your own products', 403, errorCodes.FORBIDDEN);
  }

  if (req.body.categoryId) {
    const category = await Category.findById(req.body.categoryId);
    if (!category) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND);
  }

  Object.assign(product, req.body);
  await product.save();
  return success(res, 200, 'Status updated successfully', { product });
});

// DELETE /api/products/:id — Seller (own) or Admin; soft delete
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND);

  const isOwner = product.sellerId.toString() === req.user.id;
  if (req.user.role === 'seller' && !isOwner) {
    throw new AppError('You can only delete your own products', 403, errorCodes.FORBIDDEN);
  }

  product.isActive = false;
  await product.save();
  return success(res, 200, 'Product removed', {});
});

module.exports = { createProduct, listProducts, getProduct, updateProduct, deleteProduct };
