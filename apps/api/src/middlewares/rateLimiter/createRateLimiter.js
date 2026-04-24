export const createRateLimiter = ({ strategy, store, limit, windowMs, keyGenerator }) => {
  return (req, res, next) => {
    const key = keyGenerator(req);

    if (!key) {
      return res.status(400).json({ status: 'fail', message: 'Key not found' });
    }

    const result = strategy({
      store,
      key,
      limit,
      windowMs,
    });

    if (result.remaining !== undefined) {
      res.set('RateLimit-Remaining', result.remaining);
    }

    if (!result.allowed) {
      if (result.retryAfter) {
        res.set('Retry-After', result.retryAfter);
      }

      return res.status(429).json({
        status: 'fail',
        message: 'Too Many Requests',
      });
    }

    next();
  };
};
