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
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

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

  // End-user auth (CLAUDE.md §36) — separate signing secret from admin, so a
  // user token can never be replayed against admin routes or vice versa.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15 min
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000), // 30 days

  // Admin auth — fully separate secret/audience from end-user auth (ARCHITECTURE.md §14).
  ADMIN_JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'ADMIN_JWT_ACCESS_SECRET must be at least 32 characters'),
  ADMIN_JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  ADMIN_JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),
  // Set in production when the admin panel and API share a registrable domain
  // (e.g. ".astroai.app") so the admin session cookies can be scoped there.
  // Left unset in local dev — cookies then default to the API's own host.
  ADMIN_COOKIE_DOMAIN: z.string().optional(),

  // Google OAuth (end-user sign-in). This is the OAuth "Web client ID" — used
  // as the expected audience when verifying ID tokens from every platform
  // (mobile included; see docs/ENVIRONMENT.md).
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  // Used only by `npm run seed:admin` (backend/scripts/seedAdmin.ts) to create
  // the first super-admin account — not read by the server itself, so it's
  // optional here and validated by the script when it actually runs.
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(12).optional(),
  ADMIN_SEED_NAME: z.string().min(1).optional(),

  // Location provider (birth place search/geocoding). Defaults to 'none' —
  // a real provider must be explicitly configured; there is no fake
  // fallback (CLAUDE.md §51). Timezone is never sourced from this provider:
  // it's always computed from coordinates via the local IANA tz database.
  LOCATION_PROVIDER: z.enum(['google', 'none']).default('none'),
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  // Astrology calculation engine. Defaults to 'none' — a real ephemeris
  // engine/provider must be explicitly configured; the app must never
  // present fabricated astrology facts as real (CLAUDE.md §11/§51). See
  // ARCHITECTURE.md §6 ("Open decision: build vs. integrate").
  ASTROLOGY_ENGINE_PROVIDER: z.enum(['none']).default('none'),

  // AI Gateway provider credentials (CLAUDE.md §8/§34) — each optional and
  // independent; a provider with no key configured is simply unavailable
  // as a routing candidate (the model router skips straight to the next
  // fallback) rather than the whole gateway failing to boot. Never sent to
  // the mobile app or any client — the gateway is server-side only.
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  // Bounds shared by every provider adapter call (CLAUDE.md §40).
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
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
