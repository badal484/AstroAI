import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setupFile.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Route/service tests share one in-memory MongoDB across the run (see
    // tests/globalSetup.ts) — sequential avoids cross-file interference.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      // Not a real secret — a fixed, non-production value used only to sign
      // tokens created and verified within the same test run.
      JWT_ACCESS_SECRET: 'test-only-user-access-secret-not-a-real-secret-value',
      ADMIN_JWT_ACCESS_SECRET: 'test-only-admin-access-secret-not-a-real-secret-value',
      GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
      // Exercises the "provider configured" path by default in integration
      // tests (global fetch is mocked per-test where a real call would
      // happen); the "not configured" default is unit-tested directly
      // against `unconfiguredLocationProvider`/`unconfiguredEngine`.
      LOCATION_PROVIDER: 'google',
      GOOGLE_PLACES_API_KEY: 'test-only-not-a-real-key',
      // Never actually dialed in test mode (ioredis is aliased to
      // ioredis-mock below) — kept only because env validation requires it.
      REDIS_URL: 'redis://127.0.0.1:6379',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      // See rateLimiter.middleware.ts / app.ts for why: avoids every test
      // run depending on a real, script-capable Redis for infrastructure
      // (rate limiting) unrelated to what these tests verify.
      ioredis: 'ioredis-mock',
    },
  },
});
