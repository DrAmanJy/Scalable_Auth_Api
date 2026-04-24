import SlidingWindowLogLimiter from '../stores/slidingWindowLogLimiter.js';

export const slidingWindowCounter = (limit = 100, windowMs = 60_000) => {
  const storage = new SlidingWindowLogLimiter(windowMs);

  return (req, res, next) => {
    const key = req.ip;

    if (!key) {
      return res.status(400).json({ status: 'fail', message: 'Key not found' });
    }

    const { count, timestamps } = storage.increment(key);

    res.set('RateLimit-Limit', limit);
    res.set('RateLimit-Remaining', Math.max(0, limit - count));

    if (count > limit) {
      const now = Date.now();
      const oldest = timestamps[0];

      const retryAfterMs = oldest + windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      res.set('Retry-After', retryAfterSeconds);

      return res.status(429).json({
        status: 'fail',
        message: 'Too Many Requests',
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
};
