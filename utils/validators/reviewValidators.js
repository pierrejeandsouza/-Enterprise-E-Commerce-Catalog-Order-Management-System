const Joi = require('joi');
const objectId = require('./objectId');

const createReviewSchema = Joi.object({
  orderId: objectId.required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow(''),
});

module.exports = { createReviewSchema };
