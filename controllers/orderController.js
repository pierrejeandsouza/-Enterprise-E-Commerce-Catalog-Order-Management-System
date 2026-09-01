const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Order, Product, Coupon } = require('../models');
const { ORDER_STATUS_TRANSITIONS } = require('../models/Order');
const { getOrCreateCart } = require('./cartController');
const { computeDiscount } = require('../utils/coupon');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// POST /api/orders — Module 7: convert cart -> order, capture shipping
// address, generate summary. Stock is re-checked and auto-decremented here
// (Module 9) inside the same flow so the two stay consistent.
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode } = req.body;

  const cart = await getOrCreateCart(req.user.id);
  if (cart.items.length === 0) {
    throw new AppError('Cart is empty', 400, errorCodes.VALIDATION_ERROR);
  }

  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());
    if (!product || !product.isActive) {
      throw new AppError('One or more products in your cart are no longer available', 409, errorCodes.CONFLICT);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`"${product.name}" only has ${product.stock} unit(s) left`, 409, errorCodes.BUSINESS_RULE_VIOLATION);
    }
    subtotal += product.price * item.quantity;
    orderItems.push({
      productId: product._id,
      sellerId: product.sellerId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
  }

  let discountAmount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    discountAmount = computeDiscount(coupon, subtotal);
    appliedCouponCode = coupon.code;
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Decrement stock (Module 9: Inventory & Stock Management)
  for (const item of orderItems) {
    await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
  }

  const order = await Order.create({
    userId: req.user.id,
    items: orderItems,
    totalAmount,
    discountAmount,
    couponCode: appliedCouponCode,
    shippingAddress,
    status: 'Placed',
    paymentStatus: 'Pending',
    statusHistory: [{ status: 'Placed', remarks: 'Order placed by customer' }],
  });

  cart.items = [];
  await cart.save();

  return success(res, 201, 'Order placed successfully', { order });
});

// GET /api/orders — customer: own orders; seller: orders containing their items; admin: all
const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  let filter = {};
  if (req.user.role === 'customer') filter.userId = req.user.id;
  else if (req.user.role === 'seller') filter['items.sellerId'] = req.user.id;
  // admin: no filter, sees all

  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return success(res, 200, 'Orders fetched', {
    orders,
    pagination: buildPaginationMeta(page, limit, totalCount),
  });
});

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND);

  const isOwner = order.userId.toString() === req.user.id;
  const isSellerOnOrder = order.items.some((i) => i.sellerId.toString() === req.user.id);
  if (req.user.role === 'customer' && !isOwner) {
    throw new AppError('Not authorized to view this order', 403, errorCodes.FORBIDDEN);
  }
  if (req.user.role === 'seller' && !isSellerOnOrder) {
    throw new AppError('Not authorized to view this order', 403, errorCodes.FORBIDDEN);
  }

  return success(res, 200, 'Order fetched', { order });
});

// PUT /api/orders/:id/status — Module 8: enforce the status transition graph
// (Placed -> Confirmed -> Shipped -> Delivered, or -> Cancelled), not a
// plain field update.
const updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND);

  const isSellerOnOrder = order.items.some((i) => i.sellerId.toString() === req.user.id);
  if (req.user.role === 'seller' && !isSellerOnOrder) {
    throw new AppError('Not authorized to update this order', 403, errorCodes.FORBIDDEN);
  }

  const allowedNext = ORDER_STATUS_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(status)) {
    throw new AppError(
      `Cannot move order from "${order.status}" to "${status}"`,
      409,
      errorCodes.BUSINESS_RULE_VIOLATION
    );
  }

  // Cancelling restores stock
  if (status === 'Cancelled') {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
    }
  }

  order.status = status;
  order.statusHistory.push({ status, remarks: remarks || '' });
  if (status === 'Delivered') order.paymentStatus = order.paymentStatus === 'Pending' ? 'Paid' : order.paymentStatus;
  await order.save();

  return success(res, 200, 'Status updated successfully', { status: order.status });
});

module.exports = { placeOrder, listOrders, getOrder, updateStatus };
