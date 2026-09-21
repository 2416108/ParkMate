function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]:', err);

  const statusCode = err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'A server error occurred. Please try again later.'
      : message
  });
}

module.exports = errorHandler;
