import { z } from 'zod';

/**
 * Mobile environment configuration. Unlike the backend/admin, React Native
 * does not read process.env at runtime — a release build has no shell
 * environment. Per-environment values are baked in at build time instead
 * (see ARCHITECTURE.md's mobile section) and validated once here with the
 * same fail-fast approach used by the other two apps, so a malformed value
 * is caught immediately rather than surfacing as a confusing runtime bug.
 *
 * No secrets belong here — the mobile app never holds API keys (CLAUDE.md §36).
 * `googleWebClientId` is not a secret: OAuth client IDs are public
 * identifiers by design (native/mobile OAuth uses PKCE, no client secret
 * involved) — see https://developers.google.com/identity/protocols/oauth2/native-app.
 */
const envSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  apiBaseUrl: z.string().url(),
  googleWebClientId: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const environments: Record<'development' | 'staging' | 'production', Env> = {
  development: {
    environment: 'development',
    apiBaseUrl: 'http://localhost:4000',
    // TODO: replace with a real Google Cloud OAuth Web client ID —
    // see docs/ENVIRONMENT.md. Google Sign-In fails clearly with this
    // placeholder rather than silently pretending to work.
    googleWebClientId:
      'REPLACE_WITH_REAL_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  },
  staging: {
    environment: 'staging',
    // TODO: replace with the real staging API host once provisioned.
    apiBaseUrl: 'https://staging-api.astroai.example.com',
    googleWebClientId:
      'REPLACE_WITH_REAL_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  },
  production: {
    environment: 'production',
    // TODO: replace with the real production API host once provisioned.
    apiBaseUrl: 'https://api.astroai.example.com',
    googleWebClientId:
      'REPLACE_WITH_REAL_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  },
};

function loadEnv(): Env {
  // __DEV__ is a React Native global set at bundle time. A real staging vs.
  // production split additionally needs a build-flavor signal (e.g. a
  // scheme/flavor-specific entry point) — TBD, tracked as an open decision
  // in ARCHITECTURE.md; development vs. production is sufficient for now.
  const selected = __DEV__ ? environments.development : environments.production;
  return envSchema.parse(selected);
}

export const env = loadEnv();
