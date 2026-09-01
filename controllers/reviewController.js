const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Review, Order, Product } = require('../models');

async function recalculateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count });
}

// POST /api/products/:productId/reviews — Module 12
// Business rule: a customer may only review a product from an order that
// actually contains it and has been Delivered.
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { orderId, rating, comment } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND);
  if (order.userId.toString() !== req.user.id) {
    throw new AppError('This order does not belong to you', 403, errorCodes.FORBIDDEN);
  }
  if (order.status !== 'Delivered') {
    throw new AppError('You can only review products from delivered orders', 409, errorCodes.BUSINESS_RULE_VIOLATION);
  }
  const containsProduct = order.items.some((i) => i.productId.toString() === productId);
  if (!containsProduct) {
    throw new AppError('This product is not part of the given order', 400, errorCodes.VALIDATION_ERROR);
  }

  let review;
  try {
    review = await Review.create({ productId, userId: req.user.id, orderId, rating, comment });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('You have already reviewed this product for this order', 409, errorCodes.CONFLICT);
    }
    throw err;
  }

  await recalculateProductRating(productId);

  return success(res, 201, 'Review submitted', { review });
});

// GET /api/products/:productId/reviews — public
const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
  return success(res, 200, 'Reviews fetched', { reviews });
});

module.exports = { createReview, listReviews };
