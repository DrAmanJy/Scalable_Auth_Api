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
