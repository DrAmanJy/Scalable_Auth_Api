export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.statusCode || 500;

  const response = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}
