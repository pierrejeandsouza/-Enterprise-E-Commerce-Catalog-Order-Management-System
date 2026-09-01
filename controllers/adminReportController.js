// Module 14: Admin Reporting & Analytics
//
// Same caveat as sellerDashboardController.js: the exact module spec was
// not captured. These endpoints are inferred from the sample endpoint the
// doc DID show us (GET /api/admin/reports/sales -> "Sales summary report")
// plus the Admin role's "oversees all orders and users" responsibility.

const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const { Order, User, Product } = require('../models');

// GET /api/admin/reports/sales — platform-wide sales summary
const salesSummary = asyncHandler(async (req, res) => {
  const [totals] = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        totalDiscountGiven: { $sum: '$discountAmount' },
      },
    },
  ]);

  const statusBreakdown = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  return success(res, 200, 'Sales summary report fetched', {
    totalRevenue: totals?.totalRevenue || 0,
    totalOrders: totals?.totalOrders || 0,
    totalDiscountGiven: totals?.totalDiscountGiven || 0,
    statusBreakdown,
  });
});

// GET /api/admin/reports/users — user/seller/customer counts (Admin oversees all users)
const userStats = asyncHandler(async (req, res) => {
  const byRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $project: { _id: 0, role: '$_id', count: 1 } },
  ]);

  const pendingSellerApprovals = await User.countDocuments({ role: 'seller', isApprovedSeller: false });

  return success(res, 200, 'User stats fetched', { byRole, pendingSellerApprovals });
});

// GET /api/admin/reports/top-products — best sellers by units sold
const topProducts = asyncHandler(async (req, res) => {
  const top = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 10 },
  ]);

  return success(res, 200, 'Top products fetched', { topProducts: top });
});

// PUT /api/admin/sellers/:id/approve — Admin approves a pending seller account
const approveSeller = asyncHandler(async (req, res) => {
  const AppError = require('../utils/AppError');
  const errorCodes = require('../utils/errorCodes');

  const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
  if (!seller) throw new AppError('Seller not found', 404, errorCodes.NOT_FOUND);

  seller.isApprovedSeller = true;
  await seller.save();

  return success(res, 200, 'Seller approved', { sellerId: seller._id });
});

module.exports = { salesSummary, userStats, topProducts, approveSeller };
