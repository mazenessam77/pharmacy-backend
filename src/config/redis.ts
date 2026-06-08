import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// Optional cache layer. Connects to REDIS_URL when set.
let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<void> => {
  if (!env.REDIS_URL) {
    logger.info('Redis: REDIS_URL not set — skipping (optional)');
    return;
  }

  try {
    // ioredis enables TLS automatically when the URL scheme is `rediss://`
    // (e.g. ElastiCache with in-transit encryption); the auth token is read
    // from the URL. Plain `redis://` (local/dev) connects without TLS.
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      // Redis is optional — give up reconnecting after ~10 tries instead of
      // looping forever so a missing cache never blocks the app.
      retryStrategy: (times) => (times > 10 ? null : Math.min(times * 200, 2000)),
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('ready', () => logger.info('Redis ready'));
    redisClient.on('error', (err: Error) => logger.error('Redis error:', err.message));
  } catch (error) {
    logger.warn('Redis connection failed (optional):', error);
    redisClient = null;
  }
};

export const getRedisClient = (): Redis | null => redisClient;
