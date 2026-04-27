import { getRedisClient } from '../../../utils/redis.js';

export class StrictSlidingWindow {
  constructor(windowDuration, limit) {
    this.storage = new Map();
    this.windowDuration = windowDuration;
    this.limit = limit;
  }

  increment(key) {
    const now = Date.now();
    const windowStart = now - this.windowDuration;

    const timestamps = this.storage.get(key) || [];

    while (timestamps.length && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    timestamps.push(now);
    this.storage.set(key, timestamps);
    if (timestamps.length > this.limit) {
      const oldest = timestamps[0];
      const retryAfterMs = oldest + this.windowDuration - now;

      return {
        count: timestamps.length,
        allowed: false,
        remaining: Math.max(0, this.limit - timestamps.length),
        retryAfterMs: retryAfterMs,
      };
    }

    return {
      count: timestamps.length,
      allowed: true,
      remaining: Math.max(0, this.limit - timestamps.length),
      retryAfterMs: 0,
    };
  }
}

export class StandardSlidingWindow {
  constructor(windowDuration, limit) {
    this.storage = new Map();
    this.windowDuration = windowDuration;
    this.limit = limit;
  }

  increment(key) {
    const now = Date.now();
    const windowStart = now - this.windowDuration;

    const timestamps = this.storage.get(key) || [];

    while (timestamps.length && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    this.storage.set(key, timestamps);
    if (timestamps.length >= this.limit) {
      const oldest = timestamps[0];
      const retryAfterMs = oldest + this.windowDuration - now;

      return {
        count: timestamps.length,
        allowed: false,
        remaining: Math.max(0, this.limit - timestamps.length),
        retryAfterMs: retryAfterMs,
      };
    }

    timestamps.push(now);
    return {
      count: timestamps.length,
      allowed: true,
      remaining: Math.max(0, this.limit - timestamps.length),
      retryAfterMs: 0,
    };
  }
}

export class StrictSlidingWindowRedis {
  constructor(windowDuration, limit) {
    this.redisClientPromise = getRedisClient();
    this.windowDuration = windowDuration;
    this.limit = limit;
  }

  async increment(key) {
    const redis = await this.redisClientPromise;

    const redisKey = `StrictSlidingWindow:${key}`;
    const now = Date.now();
    const windowStart = now - this.windowDuration;

    await redis.zRemRangeByScore(redisKey, 0, windowStart);
    const currentCount = await redis.zCard(redisKey);

    const allowed = currentCount < this.limit;
    const remaining = Math.max(0, this.limit - currentCount - (allowed ? 1 : 0));
    let retryAfterMs = 0;

    const uniqueValue = `${now}-${Math.random()}`;

    await redis.zAdd(redisKey, [{ score: now, value: uniqueValue }]);

    await redis.pExpire(redisKey, this.windowDuration);

    if (!allowed) {
      const indexToWaitFor = currentCount - this.limit + 1;
      const blockingRequest = await redis.zRangeWithScores(
        redisKey,
        indexToWaitFor,
        indexToWaitFor,
      );

      if (blockingRequest && blockingRequest.length > 0) {
        const blockingTimestamp = blockingRequest[0].score;

        retryAfterMs = blockingTimestamp + this.windowDuration - now;
      } else {
        retryAfterMs = this.windowDuration;
      }
    }

    return {
      count: allowed ? currentCount + 1 : currentCount,
      allowed,
      remaining,
      retryAfterMs,
    };
  }
}
