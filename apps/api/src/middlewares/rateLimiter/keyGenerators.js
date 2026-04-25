export const ipKeyGenerator = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown-ip'
  );
};

export const userKeyGenerator = (req) => req.user?.userId || ipKeyGenerator(req);

export const deviceKeyGenerator = (req) => req.cookies?.deviceId || ipKeyGenerator(req);

export const ipUserComboKeyGenerator = (req) => {
  const ip = ipKeyGenerator(req);
  const userId = req.user?.userId || 'guest';
  return `limiter:${ip}:${userId}`;
};
