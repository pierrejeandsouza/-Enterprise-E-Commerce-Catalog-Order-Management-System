// Module 13: Seller Dashboard APIs
//
// NOTE: the source document's exact spec for this module was never
// captured in the screenshots we have (the modules table cuts off right
// after row 12). These endpoints are a reasonable inferred implementation
// based on the module title, the "Seller ... views orders for their
// listings" actor responsibility, and the sprint-3 grouping alongside
// inventory/coupons/reviews. Revisit once the real page is available.

const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const { Product, Order } = require('../models');
const { LOW_STOCK_THRESHOLD } = require('./inventoryController');

// GET /api/seller/dashboard/summary — headline stats for the logged-in seller
const summary = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  const [productCount, lowStockCount, orderAgg] = await Promise.all([
    Product.countDocuments({ sellerId, isActive: true }),
    Product.countDocuments({ sellerId, isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } }),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.sellerId': require('mongoose').Types.ObjectId.createFromHexString(sellerId) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalOrderLines: { $sum: 1 },
        },
      },
    ]),
  ]);

  const { totalRevenue = 0, totalOrderLines = 0 } = orderAgg[0] || {};

  return success(res, 200, 'Seller dashboard summary fetched', {
    productCount,
    lowStockCount,
    totalRevenue,
    totalOrderLines,
  });
});

// GET /api/seller/dashboard/orders-by-status — breakdown of the seller's order lines by status
const ordersByStatus = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  const breakdown = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.sellerId': require('mongoose').Types.ObjectId.createFromHexString(sellerId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  return success(res, 200, 'Order status breakdown fetched', { breakdown });
});

module.exports = { summary, ordersByStatus };
