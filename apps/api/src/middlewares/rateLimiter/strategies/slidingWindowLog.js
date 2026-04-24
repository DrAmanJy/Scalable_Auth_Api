export const slidingWindowStrategy = ({ store, key, limit }) => {
  const count = store.increment(key);

  if (count > limit) {
    return {
      allowed: false,
      retryAfter: store.getRetryAfter(key) / 1000,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
  };
};
