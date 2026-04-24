import { createRateLimiter } from '.';

import FixedWindowStore from './stores/fixedWindowLimiter.js';
import SlidingWindowLogStore from './stores/slidingWindowLogLimiter.js';

import { fixedWindowStrategy } from './strategies/fixedWindow.js';
import { slidingWindowStrategy } from './strategies/SlidingWindowLog.js';

export const globalLimiter = createRateLimiter({
  strategy: fixedWindowStrategy,
  store: new FixedWindowStore(60_000),
  limit: 100,
  windowMs: 60_000,
  keyGenerator: (req) => req.ip,
});

export const globalLimiterV2 = createRateLimiter({
  strategy: slidingWindowStrategy,
  store: new SlidingWindowLogStore(60_000),
  limit: 100,
  windowMs: 60_000,
  keyGenerator: (req) => req.ip,
});
