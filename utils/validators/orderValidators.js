const Joi = require('joi');

const placeOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  couponCode: Joi.string().trim().uppercase().optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Confirmed', 'Shipped', 'Delivered', 'Cancelled').required(),
  remarks: Joi.string().allow('').max(500),
});

module.exports = { placeOrderSchema, updateStatusSchema };
