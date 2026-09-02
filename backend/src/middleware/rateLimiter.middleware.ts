import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisReply } from 'rate-limit-redis';
import { env } from '../config/env';
import { redis } from '../lib/redis';
import { RateLimitedError } from '../shared/errors';

/**
 * Redis-backed rate limiting foundation (ARCHITECTURE.md §15). Shared limiter
 * state across instances since Redis (not in-memory) holds the counters.
 * Feature-specific limiters (stricter for auth/OTP/payments) are layered on
 * top of this default once those routes exist — this is the general default.
 *
 * In NODE_ENV=test this returns a no-op passthrough instead of touching
 * Redis: RedisStore loads a Lua script as soon as it's constructed, which
 * would make every test run depend on a real (script-capable) Redis for a
 * concern unrelated to what the tests actually verify.
 */
export function createRateLimiter(
  options: { windowMs?: number; max?: number; keyPrefix?: string } = {},
): RequestHandler {
  if (env.NODE_ENV === 'test') {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    limit: options.max ?? env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: `rl:${options.keyPrefix ?? 'default'}:`,
      sendCommand: (command: string, ...rest: string[]): Promise<RedisReply> =>
        redis.call(command, rest) as Promise<RedisReply>,
    }),
    handler: (_req, _res, next) => {
      next(new RateLimitedError());
    },
  });
}

export const defaultRateLimiter = createRateLimiter();
