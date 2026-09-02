import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../shared/logger';

/**
 * Single shared Redis client for caching, rate limiting and BullMQ (CLAUDE.md §41).
 * Redis is never used as the source of truth for financial data — see wallet module.
 *
 * No `lazyConnect` here: rate-limit-redis's RedisStore sends a command
 * (loading its Lua script) as soon as it's constructed at module-import
 * time, which would race with an explicit lazy `.connect()` call later and
 * throw "Redis is already connecting/connected". Instead, the client
 * connects immediately on instantiation and `connectRedis()` just waits for
 * the `ready` event, which is safe to call regardless of what state the
 * connection is already in.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on('error', (error: Error) => {
  logger.error({ err: error }, 'Redis connection error');
});

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') return;

  await new Promise<void>((resolve, reject) => {
    redis.once('ready', resolve);
    redis.once('error', reject);
  });

  logger.info('Redis connected');
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}
