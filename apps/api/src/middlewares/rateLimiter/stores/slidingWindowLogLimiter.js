export default class SlidingWindowLogStore {
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
    return timestamps.length;
  }

  getRetryAfter(key) {
    const timestamps = this.storage.get(key) || [];

    const now = Date.now();
    if (!timestamps || now >= timestamps[0] + this.windowDuration) {
      return 0;
    }

    const oldest = timestamps[0];

    return oldest + this.windowDuration - now;
  }
}
