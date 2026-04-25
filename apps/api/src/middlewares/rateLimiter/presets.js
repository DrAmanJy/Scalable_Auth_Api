import { createRateLimiter } from './createRateLimiter.js';
import { ipKeyGenerator, ipUserComboKeyGenerator, userKeyGenerator } from './keyGenerators.js';
import FixedWindowStore from './stores/fixedWindowLimiter.js';
import SlidingWindowLogStore from './stores/slidingWindowLogLimiter.js';
import { fixedWindowStrategy } from './strategies/fixedWindow.js';
import { slidingWindowStrategy } from './strategies/slidingWindowLog.js';

/**
 * 1. TESTING LIMITER
 * Designed to be triggered easily in a browser or Postman.
 * Limit: 3 requests per 10 seconds.
 */
export const testLimiter = createRateLimiter({
  strategy: slidingWindowStrategy,
  store: new SlidingWindowLogStore(10_000),
  limit: 3,
  windowMs: 10_000,
  keyGenerator: ipUserComboKeyGenerator,
});

/**
 * 2. AUTH PRESET (STRICT)
 * Use for /login, /register, and /forgot-password.
 * Limit: 5 attempts per 15 minutes.
 */
export const authLimiter = createRateLimiter({
  strategy: slidingWindowStrategy,
  store: new SlidingWindowLogStore(15 * 60_000),
  limit: 5,
  windowMs: 15 * 60_000,
  keyGenerator: userKeyGenerator,
});

/**
 * 3. STANDARD API PRESET
 * General purpose protection for public routes.
 * Limit: 60 requests per minute.
 */
export const publicApiLimiter = createRateLimiter({
  strategy: fixedWindowStrategy,
  store: new FixedWindowStore(60_000),
  limit: 60,
  windowMs: 60_000,
  keyGenerator: ipKeyGenerator,
});

/**
 * 4. HIGH THROUGHPUT PRESET
 * For static assets or internal webhooks.
 * Limit: 1000 requests per minute.
 */
export const assetLimiter = createRateLimiter({
  strategy: fixedWindowStrategy,
  store: new FixedWindowStore(60_000),
  limit: 1000,
  windowMs: 60_000,
  keyGenerator: ipKeyGenerator,
});
