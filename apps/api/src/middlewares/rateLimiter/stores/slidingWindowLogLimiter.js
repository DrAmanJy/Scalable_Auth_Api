export default class SlidingWindowLogLimiter {
  constructor(windowDuration) {
    this.storage = new Map();
    this.windowDuration = windowDuration;
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
    return {
      count: timestamps.length,
      timestamps,
    };
  }
}
