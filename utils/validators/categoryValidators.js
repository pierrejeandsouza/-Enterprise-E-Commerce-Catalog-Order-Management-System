const Joi = require('joi');
const objectId = require('./objectId');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  parentCategoryId: objectId.allow(null).optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  parentCategoryId: objectId.allow(null),
}).min(1);

module.exports = { createCategorySchema, updateCategorySchema };
