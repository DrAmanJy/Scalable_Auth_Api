import { createClient } from 'redis';

/** @type {ReturnType<typeof createClient>} */
let redisClient;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUri = process.env.REDIS_CLOUD_URI;
  const isTlsUrl = typeof redisUri === 'string' && redisUri.startsWith('rediss://');

  redisClient = createClient({
    url: redisUri,
    pingInterval: 1000 * 60 * 3, // Keep connection alive when idle
    socket: {
      tls: isTlsUrl,
    },
  });

  redisClient.on('error', (err) => {
    // Suppress connection reset and timeout errors when app is idle and not actively using Redis
    if (err?.code === 'ECONNRESET' || err?.name === 'ConnectionTimeoutError') {
      return;
    }
    console.error('Redis Error:', err);
  });

  await redisClient.connect();
  console.log('New Redis connection established.');

  return redisClient;
}
