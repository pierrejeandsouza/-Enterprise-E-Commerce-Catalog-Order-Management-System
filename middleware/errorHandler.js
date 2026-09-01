const { error } = require('../utils/apiResponse');
const errorCodes = require('../utils/errorCodes');

// 404 handler for unmatched routes — returns a clean JSON 404 instead of
// Express's default HTML page (a listed pitfall to avoid).
function notFound(req, res, next) {
  return error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, errorCodes.NOT_FOUND);
}

// Centralized error-handling middleware. Every controller either throws an
// AppError / lets a Mongoose error bubble up, and this is the single place
// that turns it into the standard { success:false, message, errorCode } body
// — so the server never crashes on an unhandled rejection or thrown error.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Known operational errors thrown deliberately by controllers
  if (err.isOperational) {
    return error(res, err.statusCode || 400, err.message, err.errorCode || errorCodes.VALIDATION_ERROR);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return error(res, 400, message, errorCodes.VALIDATION_ERROR);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return error(res, 404, `Invalid identifier: ${err.value}`, errorCodes.NOT_FOUND);
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return error(res, 409, `Duplicate value for ${field}`, errorCodes.CONFLICT);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return error(res, 401, 'Invalid or expired token', errorCodes.TOKEN_INVALID);
  }

  // Fallback: never leak stack traces, never crash the process
  return error(res, 500, 'Something went wrong on the server', errorCodes.SERVER_ERROR);
}

module.exports = { notFound, errorHandler };
