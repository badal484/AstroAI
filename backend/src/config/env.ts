import 'dotenv/config';
import { z } from 'zod';

/**
 * All backend environment variables, validated once at process start.
 * Boot fails fast (with a readable error) instead of surfacing missing
 * config as a runtime surprise later — see CLAUDE.md §36/§39.
 *
 * Every variable here must be documented in `backend/.env.example` and
 * `docs/ENVIRONMENT.md`.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Correlation / logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Redis (caching, rate limiting, BullMQ, Socket.IO adapter — CLAUDE.md §41)
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // CORS — comma-separated list of allowed origins (admin panel, and any future web client)
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),

  // Rate limiting foundation
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${formatted}`);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
