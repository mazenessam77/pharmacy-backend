import { env } from './env';
import { logger } from '../utils/logger';

// Redis is optional - placeholder for future implementation
// Install ioredis if needed: npm install ioredis @types/ioredis

let redisClient: any = null;

export const connectRedis = async (): Promise<void> => {
  try {
    // Uncomment when Redis is needed:
    // const Redis = require('ioredis');
    // redisClient = new Redis(env.REDIS_URL);
    // redisClient.on('connect', () => logger.info('Redis connected'));
    // redisClient.on('error', (err: Error) => logger.error('Redis error:', err));
    logger.info('Redis: not configured (optional)');
  } catch (error) {
    logger.warn('Redis connection failed (optional):', error);
  }
};

export const getRedisClient = () => redisClient;
