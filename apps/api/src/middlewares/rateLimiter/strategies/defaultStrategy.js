export const defaultStrategy = ({ store, key, limit }) => {
  const { count, remaining, retryAfterMs, allowed = true } = store.increment(key);
  console.log({ count, remaining, retryAfterMs });

  if (!allowed) {
    return {
      allowed: false,
      retryAfter: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    };
  }

  if (count > limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining,
  };
};
