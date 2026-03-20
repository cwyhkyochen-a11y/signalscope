/**
 * Global error-handling middleware.
 * Any route that throws (including async) ends up here.
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[${req.method}] ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  const code = err.statusCode || 500;
  res.status(code).json({
    error: code === 500 ? 'Internal server error' : err.message,
  });
};

/**
 * Wrap async route handlers so thrown errors propagate to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
