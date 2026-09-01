// Wraps an async controller so any rejected promise is forwarded to
// next(err) -> the centralized error handler, instead of crashing the
// process with an unhandled rejection.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
