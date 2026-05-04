import { createRateLimiter } from './createRateLimiter.js';
import { ipKeyGenerator, ipUserComboKeyGenerator, userKeyGenerator } from './keyGenerators.js';

// Stores
import {
  FixedWindow,
  StandardSlidingWindow,
  FixedWindowRedis,
  StrictSlidingWindowRedis,
  TokenBucketRedis,
} from './algorithms/index.js';

/**
 * 1. TESTING LIMITER
 * Designed to be triggered easily in a browser or Postman.
 */
export const testLimiter = createRateLimiter({
  strategy: new TokenBucketRedis(10, 2, 10_000),
  keyGenerator: ipUserComboKeyGenerator,
});

/**
 * 2. AUTH PRESET (STRICT)
 * Use for /login, /register, and /forgot-password.
 * Limit: 5 attempts per 15 minutes.
 */
export const authLimiter = createRateLimiter({
  strategy: new StandardSlidingWindow(15 * 60_000, 5),
  keyGenerator: userKeyGenerator,
});

/**
 * 3. STANDARD API PRESET
 * General purpose protection for public routes.
 * Limit: 60 requests per minute.
 */
export const publicApiLimiter = createRateLimiter({
  strategy: new FixedWindow(60_000),
  keyGenerator: ipKeyGenerator,
});

/**
 * 4. HIGH THROUGHPUT PRESET
 * For static assets or internal webhooks.
 * Limit: 1000 requests per minute.
 */
export const assetLimiter = createRateLimiter({
  strategy: new FixedWindow(60_000, 1000),
  keyGenerator: ipKeyGenerator,
});
