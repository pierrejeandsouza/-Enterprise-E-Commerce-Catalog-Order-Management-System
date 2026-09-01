const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Coupon } = require('../models');
const { computeDiscount } = require('../utils/coupon');

// POST /api/coupons — Admin creates a coupon (Module 10)
const createCoupon = asyncHandler(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code });
  if (existing) throw new AppError('Coupon code already exists', 409, errorCodes.CONFLICT);

  const coupon = await Coupon.create(req.body);
  return success(res, 201, 'Coupon created', { coupon });
});

// GET /api/coupons — Admin: manage all coupons
const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return success(res, 200, 'Coupons fetched', { coupons });
});

// POST /api/coupons/apply — validate/apply a coupon against a given cart total
// (standalone check the frontend/Postman can call before checkout)
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  const coupon = await Coupon.findOne({ code });
  const discount = computeDiscount(coupon, cartTotal);

  return success(res, 200, 'Coupon applied', {
    code: coupon.code,
    discount,
    finalAmount: cartTotal - discount,
  });
});

// PUT /api/coupons/:id — Admin toggles active/updates a coupon
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new AppError('Coupon not found', 404, errorCodes.NOT_FOUND);
  return success(res, 200, 'Coupon updated', { coupon });
});

module.exports = { createCoupon, listCoupons, applyCoupon, updateCoupon };
