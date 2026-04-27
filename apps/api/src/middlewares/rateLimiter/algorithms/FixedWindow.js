import { getRedisClient } from '../../../utils/redis.js';

export class FixedWindow {
  constructor(windowDuration, limit) {
    this.storage = new Map();
    this.windowDuration = windowDuration;
    this.limit = limit;
  }

  increment(key) {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      this.storage.set(key, { count: 1, start: now });
      return {
        count: 1,
        allowed: true,
        remaining: this.limit - 1,
        retryAfterMs: 0,
      };
    }

    if (now > entry.start + this.windowDuration) {
      this.storage.set(key, { count: 1, start: now });
      return {
        count: 1,
        allowed: true,
        remaining: this.limit - 1,
        retryAfterMs: 0,
      };
    }

    if (entry.count >= this.limit) {
      const expirationTime = entry.start + this.windowDuration;

      return {
        count: entry.count,
        allowed: false,
        remaining: this.limit - entry.count,
        retryAfterMs: expirationTime - now,
      };
    }

    entry.count++;
    return {
      count: entry.count,
      allowed: true,
      remaining: this.limit - entry.count,
      retryAfterMs: 0,
    };
  }
}

export class FixedWindowRedis {
  constructor(windowDuration, limit) {
    this.redisClientPromise = getRedisClient();
    this.windowDuration = windowDuration;
    this.limit = limit;
  }

  async increment(key) {
    const redis = await this.redisClientPromise;

    const redisKey = `fixedWindow:${key}`;

    const currentCount = await redis.incr(redisKey);

    if (currentCount === 1) {
      await redis.pExpire(redisKey, this.windowDuration);
    }

    const allowed = currentCount <= this.limit;
    const remaining = Math.max(0, this.limit - currentCount);

    let retryAfterMs = 0;
    if (!allowed) {
      retryAfterMs = await redis.pTTL(redisKey);
    }

    return {
      count: currentCount,
      allowed,
      remaining,
      retryAfterMs,
    };
  }
}
