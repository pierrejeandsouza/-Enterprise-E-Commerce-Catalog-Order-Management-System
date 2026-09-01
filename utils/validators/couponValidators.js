const Joi = require('joi');

const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30).required(),
  discountType: Joi.string().valid('percentage', 'flat').required(),
  value: Joi.number().min(0).required(),
  validTill: Joi.date().greater('now').required(),
  minOrderValue: Joi.number().min(0).default(0),
});

const applyCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  cartTotal: Joi.number().min(0).required(),
});

module.exports = { createCouponSchema, applyCouponSchema };
