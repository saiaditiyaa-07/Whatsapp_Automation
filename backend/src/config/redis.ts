import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redis: Redis | null = null;
let isRedisEnabled = false;

try {
  console.log(`[Redis]: Connecting to instance at ${redisUrl}...`);
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`[Redis Warning]: Connection failed 3 times. Falling back to memory cache.`);
        return null; // Stop retrying, flag as disabled
      }
      return Math.min(times * 100, 1000);
    },
  });

  redis.on('connect', () => {
    console.log('[Redis]: Connected successfully 🚀');
    isRedisEnabled = true;
  });

  redis.on('error', (err) => {
    console.warn(`[Redis Error]: Connection issues detected: ${err.message}`);
    isRedisEnabled = false;
  });
} catch (error: any) {
  console.warn(`[Redis Exception]: Initialization error: ${error.message}`);
}

export { redis, isRedisEnabled };
