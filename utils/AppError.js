// Lightweight operational-error class so controllers can `throw` and let the
// centralized error handler translate it into the standard error JSON shape.
class AppError extends Error {
  constructor(message, statusCode = 400, errorCode = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
