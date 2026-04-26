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
