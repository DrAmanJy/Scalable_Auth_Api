import { getRedisClient } from '../../../utils/redis.js';

export class TokenBucket {
  constructor(capacity, refillRate, refillIntervalMs) {
    this.storage = new Map();
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;
  }

  increment(key) {
    if (this.capacity === 0) {
      return { allowed: false, count: 0, remaining: 0, retryAfterMs: this.refillIntervalMs };
    }

    const now = Date.now();
    const entry = this.storage.get(key);
    if (!entry) {
      this.storage.set(key, {
        tokens: this.capacity - 1,
        lastRefill: now,
      });
      return { count: 1, allowed: true, remaining: this.capacity - 1, retryAfterMs: 0 };
    }

    const timePassed = now - entry.lastRefill;
    const intervalsPassed = Math.floor(timePassed / this.refillIntervalMs);

    if (intervalsPassed > 0) {
      const tokensToAdd = intervalsPassed * this.refillRate;

      entry.tokens = Math.min(this.capacity, entry.tokens + tokensToAdd);

      entry.lastRefill += intervalsPassed * this.refillIntervalMs;
    }

    if (entry.tokens > 0) {
      entry.tokens--;
      return {
        count: this.capacity - entry.tokens,
        allowed: true,
        remaining: entry.tokens,
        retryAfterMs: 0,
      };
    }

    const timeSinceLastRefill = now - entry.lastRefill;
    const remainder = timeSinceLastRefill % this.refillIntervalMs;
    const retryAfterMs =
      remainder === 0 ? this.refillIntervalMs : this.refillIntervalMs - remainder;

    return {
      count: this.capacity,
      allowed: false,
      remaining: entry.tokens,
      retryAfterMs,
    };
  }
}

export class TokenBucketRedis {
  constructor(capacity, refillRate, refillIntervalMs) {
    this.redisClientPromise = getRedisClient();
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;
  }

  async increment(key) {
    const now = Date.now();
    const redis = await this.redisClientPromise;
    const redisKey = `tokenBucket:${key}`;

    let bucket = await redis.json.get(redisKey);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
    }

    const timePassed = now - bucket.lastRefill;
    const intervalsPassed = Math.floor(timePassed / this.refillIntervalMs);

    if (intervalsPassed > 0) {
      const tokensToAdd = intervalsPassed * this.refillRate;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = bucket.lastRefill + intervalsPassed * this.refillIntervalMs;
    }

    let retryAfterMs = 0;
    let allowed = false;

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      allowed = true;
    } else {
      const remainder = timePassed % this.refillIntervalMs;
      retryAfterMs = remainder === 0 ? this.refillIntervalMs : this.refillIntervalMs - remainder;
    }

    await redis.json.set(redisKey, '$', bucket);

    await redis.pExpire(redisKey, this.capacity * this.refillIntervalMs);

    return {
      count: this.capacity - bucket.tokens,
      allowed,
      remaining: bucket.tokens,
      retryAfterMs,
    };
  }
}
