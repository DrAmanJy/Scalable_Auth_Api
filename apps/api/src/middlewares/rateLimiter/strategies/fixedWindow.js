import FixedWindowLimiter from '../stores/fixedWindowLimiter.js';

export const fixedWindowCounter = (limit = 100, windowMs = 60_000) => {
  const storage = new FixedWindowLimiter(windowMs);

  return (req, res, next) => {
    const key = req.ip;

    if (!key) {
      return res.status(400).json({ status: 'fail', message: 'Key not found' });
    }

    const count = storage.increment(key);

    if (count > limit) {
      return res.status(429).json({ status: 'fail', message: 'Too Many Requests' });
    }

    next();
  };
};
