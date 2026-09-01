const Joi = require('joi');

const updatePaymentSchema = Joi.object({
  paymentStatus: Joi.string().valid('Pending', 'Paid', 'Failed', 'Refunded').required(),
  paymentMode: Joi.string().max(40),
});

module.exports = { updatePaymentSchema };
