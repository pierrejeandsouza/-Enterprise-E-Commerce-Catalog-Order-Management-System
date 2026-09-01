const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Order } = require('../models');

// POST /api/payments/:orderId/mock-charge — Module 11
// Simulates a payment gateway callback (per spec: "mock gateway integration
// is acceptable"). In a real system this would be a webhook from
// Stripe/Razorpay/etc.; here it just records the outcome deterministically.
const mockCharge = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND);

  const isOwner = order.userId.toString() === req.user.id;
  if (req.user.role === 'customer' && !isOwner) {
    throw new AppError('Not authorized for this order', 403, errorCodes.FORBIDDEN);
  }
  if (order.paymentStatus === 'Paid') {
    throw new AppError('Order is already paid', 409, errorCodes.CONFLICT);
  }
  if (order.status === 'Cancelled') {
    throw new AppError('Cannot charge a cancelled order', 409, errorCodes.BUSINESS_RULE_VIOLATION);
  }

  order.paymentStatus = 'Paid';
  order.paymentMode = req.body.paymentMode || 'MOCK_GATEWAY';
  await order.save();

  return success(res, 200, 'Payment recorded', { orderId: order._id, paymentStatus: order.paymentStatus });
});

// PUT /api/payments/:orderId — Admin/Seller manually corrects payment status
// (refunds, failed-payment reconciliation)
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND);

  order.paymentStatus = req.body.paymentStatus;
  if (req.body.paymentMode) order.paymentMode = req.body.paymentMode;
  await order.save();

  return success(res, 200, 'Payment status updated', { orderId: order._id, paymentStatus: order.paymentStatus });
});

// GET /api/payments/:orderId
const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select('userId paymentStatus paymentMode');
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND);

  const isOwner = order.userId.toString() === req.user.id;
  if (req.user.role === 'customer' && !isOwner) {
    throw new AppError('Not authorized for this order', 403, errorCodes.FORBIDDEN);
  }

  return success(res, 200, 'Payment status fetched', {
    orderId: order._id,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,
  });
});

module.exports = { mockCharge, updatePaymentStatus, getPaymentStatus };
