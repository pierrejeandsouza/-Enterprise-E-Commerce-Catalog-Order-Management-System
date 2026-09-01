const { error } = require('../utils/apiResponse');
const errorCodes = require('../utils/errorCodes');

// Generic Joi-schema validation middleware.
// Usage: router.post('/', validate(schema), controller)
// `part` is which part of the request to validate: 'body' | 'query' | 'params'
function validate(schema, part = 'body') {
  return (req, res, next) => {
    const { error: validationError, value } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (validationError) {
      const message = validationError.details.map((d) => d.message).join('; ');
      return error(res, 400, message, errorCodes.VALIDATION_ERROR);
    }

    req[part] = value;
    return next();
  };
}

module.exports = validate;
