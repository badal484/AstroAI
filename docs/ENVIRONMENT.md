# Environment Variables

Every environment variable used by AstroAI, across all three apps. No app reads `process.env`
(or, for mobile, a build-time equivalent) without validating it first — see each app's
`config/env.ts`. Missing or malformed required variables cause the app to fail fast at startup
with a readable error, rather than surfacing as a confusing runtime bug later.

**Never commit real secrets.** `.env` files are git-ignored everywhere; only `.env.example` /
`.env.local` (empty/placeholder) templates are committed. Local development values below are
plain local connection strings (e.g. `mongodb://localhost:27017`), not secrets.

## Backend (`backend/.env`, template at `backend/.env.example`)

| Variable                        | Required | Default       | Description                                                                                                                                                                                                                                             |
| ------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                      | no       | `development` | One of `development`, `test`, `staging`, `production`.                                                                                                                                                                                                  |
| `PORT`                          | no       | `4000`        | Port the Express server listens on.                                                                                                                                                                                                                     |
| `LOG_LEVEL`                     | no       | `info`        | pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`.                                                                                                                                                                           |
| `MONGODB_URI`                   | **yes**  | —             | MongoDB Atlas (or local `mongod`) connection string. **Must be a replica set** (Atlas clusters always are) — auth uses multi-document transactions, which a standalone `mongod` rejects. See the comment in `.env.example` for running one locally.     |
| `REDIS_URL`                     | **yes**  | —             | Redis connection string (caching, rate limiting, BullMQ, Socket.IO adapter).                                                                                                                                                                            |
| `CORS_ALLOWED_ORIGINS`          | no       | `` (empty)    | Comma-separated list of origins allowed to call the API with credentials (the admin panel's URL(s)). Mobile traffic is not browser-originated and is unaffected by CORS. Also configures the chat Socket.IO server's CORS (`modules/chat/chat.socket.ts`) — no separate variable for it.                |
| `RATE_LIMIT_WINDOW_MS`          | no       | `60000`       | Default rate-limit window, in milliseconds.                                                                                                                                                                                                             |
| `RATE_LIMIT_MAX_REQUESTS`       | no       | `100`         | Default max requests per window per client.                                                                                                                                                                                                             |
| `JWT_ACCESS_SECRET`             | **yes**  | —             | Signs end-user access tokens. Min 32 chars. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.                                                                                                                   |
| `JWT_ACCESS_TTL_SECONDS`        | no       | `900`         | End-user access token lifetime (15 min).                                                                                                                                                                                                                |
| `JWT_REFRESH_TTL_SECONDS`       | no       | `2592000`     | End-user refresh token / session lifetime (30 days).                                                                                                                                                                                                    |
| `ADMIN_JWT_ACCESS_SECRET`       | **yes**  | —             | Signs admin access tokens. **Must differ from `JWT_ACCESS_SECRET`** — the two auth systems are fully independent (ARCHITECTURE.md §14). Min 32 chars.                                                                                                   |
| `ADMIN_JWT_ACCESS_TTL_SECONDS`  | no       | `900`         | Admin access token lifetime.                                                                                                                                                                                                                            |
| `ADMIN_JWT_REFRESH_TTL_SECONDS` | no       | `2592000`     | Admin refresh token / session lifetime.                                                                                                                                                                                                                 |
| `ADMIN_COOKIE_DOMAIN`           | no       | unset         | Set only in production, when the admin panel and API share a registrable domain (e.g. `.astroai.app`) the session cookies should be scoped to. Left unset in local dev.                                                                                 |
| `GOOGLE_CLIENT_ID`              | **yes**  | —             | Google OAuth **Web client ID** from Google Cloud Console — used as the expected audience when verifying Google ID tokens from every platform, mobile included. Not a secret by itself, but treat the whole OAuth client configuration as project-owned. |
| `ADMIN_SEED_EMAIL`              | no\*     | —             | Used only by `npm run seed:admin` to create the first super-admin account. Not read by the server.                                                                                                                                                      |
| `ADMIN_SEED_PASSWORD`           | no\*     | —             | ditto — min 12 characters.                                                                                                                                                                                                                              |
| `ADMIN_SEED_NAME`               | no\*     | —             | ditto.                                                                                                                                                                                                                                                  |
| `LOCATION_PROVIDER`             | no       | `none`        | `none` or `google`. `none` means birth-location search returns a clear "not configured" error (the mobile app falls back to manual location entry) — see "Location provider" below.                                                                     |
| `GOOGLE_PLACES_API_KEY`         | no\*\*   | —             | Google Geocoding API key. Required only when `LOCATION_PROVIDER=google`.                                                                                                                                                                                |
| `ASTROLOGY_ENGINE_PROVIDER`     | no       | `none`        | Only `none` exists today. Astrology endpoints return a clear 503 until a real engine is wired in — see "Astrology engine" below. Never set to fake/mock a provider in this codebase (CLAUDE.md §51).                                                    |
| `OPENAI_API_KEY`                | no       | unset         | Enables the OpenAI adapter in the AI Gateway. See "AI Gateway" below.                                                                                                                                                                                   |
| `ANTHROPIC_API_KEY`             | no       | unset         | Enables the Anthropic adapter.                                                                                                                                                                                                                          |
| `GEMINI_API_KEY`                | no       | unset         | Enables the Gemini adapter (Google's `@google/genai` SDK).                                                                                                                                                                                              |
| `AI_REQUEST_TIMEOUT_MS`         | no       | `20000`       | Per-call timeout the model router enforces on every provider adapter call, regardless of provider.                                                                                                                                                      |

\* Required when actually _running_ `npm run seed:admin` — the script itself validates and exits
with a clear error if any of the three are missing; the main server never reads them.
\*\* Required only when `LOCATION_PROVIDER=google`; validated at request time by that provider, not
at server startup.

Validated by `backend/src/config/env.ts` (Zod). Not yet present (added when their owning module is
implemented, per ARCHITECTURE.md's open decisions): Razorpay keys, other AI provider API keys,
push/email/SMS provider credentials.

### Location provider

Birth-place search (`GET /api/v1/locations/search`) and place resolution go through a pluggable
`LocationProviderAdapter` (`backend/src/modules/location/location.provider.types.ts`). With
`LOCATION_PROVIDER=none` (the default), search requests get a `503
LOCATION_PROVIDER_UNAVAILABLE` — deliberately, rather than a fake/empty result (CLAUDE.md §51) —
and the mobile app's birth profile form falls back to manual location entry. Set
`LOCATION_PROVIDER=google` and a `GOOGLE_PLACES_API_KEY` (Google Cloud Console → enable the
Geocoding API) to enable real search and ambiguous-location disambiguation.

Timezone is **never** taken from the location provider or from client input — it's always
computed server-side from the resolved coordinates using the local IANA timezone-boundary
dataset (`geo-tz`, comprehensive/historical variant), so it stays correct even for manually
entered locations and pre-1970 birth dates with historical timezone boundaries.

### Astrology engine

The astrology calculation engine (`AstrologyEngine` interface,
`backend/src/modules/astrology/engine/astrologyEngine.types.ts`) is the sole authoritative
source of planetary positions, houses, ascendant, nakshatra, dasha, antardasha, yogas, transits
and compatibility scores — the AI layer is never allowed to compute these itself (CLAUDE.md §11).

No real engine ships in this codebase yet (`ASTROLOGY_ENGINE_PROVIDER=none` is the only value
today) — see ARCHITECTURE.md §6's open build-vs-integrate decision. Every astrology endpoint
returns a clear `503 ASTROLOGY_ENGINE_UNAVAILABLE` in this state. To wire in a real engine (an
in-house ephemeris binding or a licensed Vedic astrology API), implement `AstrologyEngine` and
register it in `modules/astrology/engine/registry.ts` — no caller (astrology.service, and later
chat/reports/horoscope) needs to change.

### AI Gateway

`modules/ai` is the only place in the backend allowed to import an AI provider SDK (CLAUDE.md
§8) — OpenAI, Anthropic and Gemini adapters all ship for real, each active only when its API key
is set. A provider with no key configured is treated as just another fallback-eligible routing
candidate (never a fake response), so the app works with zero, one, two or all three keys set.

Business modules never reference a provider or model id — they call `aiGateway.generateText()` /
`streamText()` / `generateStructured()` / `classifyIntent()` / `generateEmbedding()` with a
logical `ModelAlias` (`fast-chat`, `smart-chat`, `reasoning`, `voice-chat`, `report-generation`,
`summarization`, `classification`). The model router resolves an alias to a provider/model via
`modules/ai/router/defaultRouting.ts` (the built-in default) or an admin override persisted in
the `aiRoutingConfigs` collection (`modules/ai/aiConfig.service.ts`, Redis-cached, invalidated on
write) — no admin UI exists yet to edit that collection, but the storage/service layer is ready
for one.

Every call is timeout-bounded (`AI_REQUEST_TIMEOUT_MS`), retried once on the same provider for
transient errors (timeout/5xx), and falls back to the alias's next configured provider on
timeout/rate-limit/5xx/not-configured — never on an authentication or invalid-request error,
since switching providers won't fix those. Every attempt (success or failure) is recorded to the
`aiUsageEvents` collection with latency, token usage and an estimated cost where available
(`modules/ai/costRates.ts`), fire-and-forget so logging never adds latency to the caller.

### Creating the first admin account

There is no public admin registration route (CLAUDE.md §51 — no hardcoded admin credentials in
application code). Run, with a real MongoDB reachable via `MONGODB_URI`:

```bash
ADMIN_SEED_EMAIL=you@astroai.app ADMIN_SEED_PASSWORD='a-real-password-12+chars' ADMIN_SEED_NAME="Your Name" \
  npm run seed:admin --workspace=backend
```

This creates one `super_admin` account. It's idempotent — re-running with the same email is a
no-op if the account already exists.

## Admin (`admin/.env.local`, template at `admin/.env.example`)

| Variable                   | Required | Default | Description                                                                                                                                                                                                                                                     |
| -------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | **yes**  | —       | Base URL of the backend API, e.g. `http://localhost:4000`. Public (browser-exposed) — the admin panel has no server-only secrets: session tokens live in httpOnly cookies set directly by the backend, never touched by admin's own code (ARCHITECTURE.md §14). |

Validated by `admin/src/config/env.ts` (Zod). Anything added later that must stay server-only
(never sent to the browser) must **not** use the `NEXT_PUBLIC_` prefix — Next.js exposes any
variable with that prefix to client bundles.

Admin authentication itself needs no client-side secret: `POST /api/v1/admin/auth/login` sets
`admin_access_token` and `admin_refresh_token` as httpOnly cookies scoped to `Path=/` — the
browser sends them automatically on both the admin app's own page requests (so `proxy.ts` can see
whether a session exists) and cross-origin API calls (so `credentials: 'include'` fetches
authenticate), and admin's own JavaScript never reads or stores the token values.

## Mobile

React Native has no runtime `process.env` — a release build has no shell environment to read.
Per-environment values (`development` / `staging` / `production`) are baked in at build time
instead, defined directly in `mobile/src/config/env.ts` and validated with the same Zod pattern
as the other two apps. There is no `.env` file to copy for mobile.

| Key                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiBaseUrl`        | Backend API base URL for this environment. `development` → `http://localhost:4000`; `staging`/`production` → placeholder hosts, to be filled in once those environments are provisioned (ARCHITECTURE.md's open decisions).                                                                                                                                                                                                                                                                                                                |
| `googleWebClientId` | The Google OAuth **Web client ID** — the _same_ one as the backend's `GOOGLE_CLIENT_ID` (see `@react-native-google-signin/google-signin`'s docs: native flows still authenticate against the Web client ID as audience). Not a secret (native/mobile OAuth uses PKCE, no client secret) — but currently a placeholder value (`REPLACE_WITH_REAL_GOOGLE_WEB_CLIENT_ID...`) in every environment, so Google Sign-In fails clearly rather than silently "succeeding" until a real Google Cloud OAuth client is created and this is filled in. |

The mobile app must never hold true secrets (API keys, client secrets) — CLAUDE.md §36 — all
provider calls that need a real secret happen server-side, behind the backend. The refresh token
issued at sign-in is the one piece of sensitive session material mobile holds, and it's kept in
MMKV encrypted storage (key held in the OS Keychain/Keystore via `react-native-keychain`, itself
never a literal in source — see `src/lib/secureStorage.ts`), never AsyncStorage.

### Google Sign-In setup (required before it works)

1. Create an OAuth 2.0 client of type **Web application** in Google Cloud Console — this is the
   "Web client ID" used everywhere above (backend's `GOOGLE_CLIENT_ID` and mobile's
   `googleWebClientId` must be the _same_ value).
2. Create additional OAuth clients of type **iOS** and **Android** in the same project (the SDK
   needs these registered, even though the Web client ID is what's actually sent as audience).
   - iOS: register the app's bundle ID; add the resulting reversed-client-id URL scheme to
     `mobile/ios/AstroAI/Info.plist`.
   - Android: register the app's package name + release/debug SHA-1 fingerprints.
3. Replace the `googleWebClientId` placeholders in `mobile/src/config/env.ts`.
4. Set the backend's `GOOGLE_CLIENT_ID` to the same Web client ID.

None of this is fabricated in this codebase (CLAUDE.md §51 forbids faking a provider
response) — until real credentials are configured, `signInWithGoogle()` fails with a real,
visible Google SDK error rather than pretending to authenticate.

## Adding a new variable

1. Add it to the relevant app's Zod schema in `config/env.ts` (or, for mobile, to the relevant
   entry in the `environments` map).
2. Add it to that app's `.env.example` (backend/admin) with a safe placeholder value.
3. Add a row to the table above.
4. Never add a variable that isn't read anywhere — an undocumented or unused variable is worse
   than no variable.
