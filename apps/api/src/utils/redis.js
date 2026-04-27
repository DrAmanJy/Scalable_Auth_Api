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
    socket: {
      tls: isTlsUrl,
    },
  });

  redisClient.on('error', (err) => console.error('Redis Error:', err));

  await redisClient.connect();
  console.log('New Redis connection established.');

  return redisClient;
}
