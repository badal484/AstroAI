import { z } from 'zod';

/**
 * Admin panel environment variables, validated at build/start time.
 * Only `NEXT_PUBLIC_*` variables are available in the browser bundle — never
 * put a secret behind that prefix. This app has no server-only secrets yet
 * (no direct DB access, per ARCHITECTURE.md §3 — it only calls the backend
 * API), so every variable here is intentionally public-safe.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid admin environment configuration:\n${formatted}`);
  }

  return parsed.data;
}

export const env = loadEnv();
