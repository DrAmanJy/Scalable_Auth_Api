export const slidingWindowStrategy = ({ store, key, limit }) => {
  const count = store.increment(key);

  if (count > limit) {
    const retryAfterMs = store.getRetryAfter(key);

    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
  };
};
