const Joi = require('joi');

// Reusable Joi rule for a valid Mongo ObjectId string.
module.exports = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('must be a valid id');
