import { User, UserDocument } from '../models/User';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Short-TTL Redis cache in front of the per-request User lookup that
 * `authenticate` / `socketAuth` perform. Cuts one Mongo round-trip from every
 * authenticated API call. Strictly best-effort: any cache failure falls back
 * to the database, and Redis being down never blocks auth.
 *
 * Ban/deactivate must take effect immediately, so every user mutation calls
 * `invalidateUserCache` — the TTL is only a safety net for missed paths.
 */
const USER_CACHE_TTL_SECONDS = 60;

const cacheKey = (userId: string) => `user:${userId}`;

export const getUserCached = async (userId: string): Promise<UserDocument | null> => {
  const redis = getRedisClient();

  if (redis && redis.status === 'ready') {
    try {
      const cached = await redis.get(cacheKey(userId));
      if (cached) {
        // hydrate() re-applies schema casting (dates, ObjectIds) to the
        // plain JSON and returns a full mongoose document.
        return User.hydrate(JSON.parse(cached)) as UserDocument;
      }
    } catch (err) {
      logger.warn('User cache read failed (falling back to DB):', (err as Error).message);
    }
  }

  const user = await User.findById(userId);

  if (user && redis && redis.status === 'ready') {
    try {
      await redis.set(cacheKey(userId), JSON.stringify(user.toObject()), 'EX', USER_CACHE_TTL_SECONDS);
    } catch (err) {
      logger.warn('User cache write failed:', (err as Error).message);
    }
  }

  return user;
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
  const redis = getRedisClient();
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.del(cacheKey(userId));
  } catch (err) {
    logger.warn('User cache invalidation failed:', (err as Error).message);
  }
};
