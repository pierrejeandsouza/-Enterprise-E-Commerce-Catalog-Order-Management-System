const Joi = require('joi');
const objectId = require('./objectId');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().min(1).required(),
  price: Joi.number().min(0).required(),
  categoryId: objectId.required(),
  stock: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string().uri()).default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().min(1),
  price: Joi.number().min(0),
  categoryId: objectId,
  stock: Joi.number().integer().min(0),
  images: Joi.array().items(Joi.string().uri()),
  isActive: Joi.boolean(),
}).min(1);

const listProductsQuerySchema = Joi.object({
  keyword: Joi.string().trim().allow(''),
  categoryId: objectId,
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minRating: Joi.number().min(0).max(5),
  sellerId: objectId,
  sort: Joi.string().valid('price_asc', 'price_desc', 'rating_desc', 'newest'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});

module.exports = { createProductSchema, updateProductSchema, listProductsQuerySchema };
