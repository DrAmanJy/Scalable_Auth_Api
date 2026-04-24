export default class FixedWindowLimiter {
  constructor(windowDuration) {
    this.storage = new Map();
    this.windowDuration = windowDuration;
  }

  increment(key) {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      this.storage.set(key, { count: 1, start: now });
      return 1;
    }

    if (now > entry.start + this.windowDuration) {
      this.storage.set(key, { count: 1, start: now });
      return 1;
    }

    entry.count++;
    return entry.count;
  }
}
