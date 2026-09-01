const AppError = require('./AppError');
const errorCodes = require('./errorCodes');

// Validates a coupon against an order subtotal and returns the discount
// amount. Shared by Module 7 (checkout) and Module 10 (standalone apply/validate).
function computeDiscount(coupon, subtotal) {
  if (!coupon || !coupon.isActive) {
    throw new AppError('Coupon not found or inactive', 404, errorCodes.NOT_FOUND);
  }
  if (coupon.validTill < new Date()) {
    throw new AppError('Coupon has expired', 400, errorCodes.BUSINESS_RULE_VIOLATION);
  }
  if (subtotal < coupon.minOrderValue) {
    throw new AppError(
      `Minimum order value for this coupon is ${coupon.minOrderValue}`,
      400,
      errorCodes.BUSINESS_RULE_VIOLATION
    );
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
  } else {
    discount = coupon.value;
  }
  return Math.min(discount, subtotal);
}

module.exports = { computeDiscount };
