export const createRateLimiter = ({
  message = 'Too many login attempts',
  strategy,
  store,
  limit,
  windowMs,
  keyGenerator,
}) => {
  return (req, res, next) => {
    let key;

    try {
      key = keyGenerator(req);
    } catch {
      return res.status(400).json({ status: 'fail', message: 'Invalid key' });
    }

    if (!key) {
      return res.status(400).json({ status: 'fail', message: 'Key not found' });
    }

    const result = strategy({ store, key, limit, windowMs });

    if (!result || typeof result.allowed !== 'boolean') {
      return res.status(500).json({ status: 'fail', message: 'Rate limiter error' });
    }

    res.set('RateLimit-Limit', limit);

    if (result.remaining !== undefined) {
      res.set('RateLimit-Remaining', result.remaining);
    }

    if (!result.allowed) {
      const retryAfter = Math.max(1, Number(result.retryAfter) || 1);

      res.set('Retry-After', retryAfter);
      res.set('RateLimit-Reset', Math.ceil((Date.now() + retryAfter * 1000) / 1000));

      return res.status(429).json({
        status: 'fail',
        message,
        retryAfter,
      });
    }

    next();
  };
};
