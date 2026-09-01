const Joi = require('joi');
const objectId = require('./objectId');

const addItemSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

module.exports = { addItemSchema, updateItemSchema };
