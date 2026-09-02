# Environment Variables

Every environment variable used by AstroAI, across all three apps. No app reads `process.env`
(or, for mobile, a build-time equivalent) without validating it first — see each app's
`config/env.ts`. Missing or malformed required variables cause the app to fail fast at startup
with a readable error, rather than surfacing as a confusing runtime bug later.

**Never commit real secrets.** `.env` files are git-ignored everywhere; only `.env.example` /
`.env.local` (empty/placeholder) templates are committed. Local development values below are
plain local connection strings (e.g. `mongodb://localhost:27017`), not secrets.

## Backend (`backend/.env`, template at `backend/.env.example`)

| Variable                  | Required | Default       | Description                                                                                                                                                              |
| ------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                | no       | `development` | One of `development`, `test`, `staging`, `production`.                                                                                                                   |
| `PORT`                    | no       | `4000`        | Port the Express server listens on.                                                                                                                                      |
| `LOG_LEVEL`               | no       | `info`        | pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`.                                                                                                      |
| `MONGODB_URI`             | **yes**  | —             | MongoDB Atlas (or local `mongod`) connection string.                                                                                                                     |
| `REDIS_URL`               | **yes**  | —             | Redis connection string (caching, rate limiting, BullMQ, Socket.IO adapter).                                                                                             |
| `CORS_ALLOWED_ORIGINS`    | no       | `` (empty)    | Comma-separated list of origins allowed to call the API with credentials (the admin panel's URL(s)). Mobile traffic is not browser-originated and is unaffected by CORS. |
| `RATE_LIMIT_WINDOW_MS`    | no       | `60000`       | Default rate-limit window, in milliseconds.                                                                                                                              |
| `RATE_LIMIT_MAX_REQUESTS` | no       | `100`         | Default max requests per window per client.                                                                                                                              |

Validated by `backend/src/config/env.ts` (Zod). Not yet present (added when their owning module is
implemented, per ARCHITECTURE.md's open decisions): Razorpay keys, AI provider API keys, JWT
signing secrets, push/email/SMS provider credentials.

## Admin (`admin/.env.local`, template at `admin/.env.example`)

| Variable                   | Required | Default | Description                                                                                                                                                                                                                         |
| -------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | **yes**  | —       | Base URL of the backend API, e.g. `http://localhost:4000`. Public (browser-exposed) — the admin panel has no server-only secrets in this foundation phase (ARCHITECTURE.md §3: it only calls the backend API, no direct DB access). |

Validated by `admin/src/config/env.ts` (Zod). Anything added later that must stay server-only
(never sent to the browser) must **not** use the `NEXT_PUBLIC_` prefix — Next.js exposes any
variable with that prefix to client bundles.

## Mobile

React Native has no runtime `process.env` — a release build has no shell environment to read.
Per-environment values (`development` / `staging` / `production`) are baked in at build time
instead, defined directly in `mobile/src/config/env.ts` and validated with the same Zod pattern
as the other two apps. There is no `.env` file to copy for mobile.

Currently only `apiBaseUrl` is defined per environment (`development` → `http://localhost:4000`;
`staging`/`production` → placeholder hosts, to be filled in once those environments exist — see
ARCHITECTURE.md's open decisions). The mobile app must never hold API keys or other secrets
(CLAUDE.md §36) — all provider calls are server-side, behind the backend.

## Adding a new variable

1. Add it to the relevant app's Zod schema in `config/env.ts` (or, for mobile, to the relevant
   entry in the `environments` map).
2. Add it to that app's `.env.example` (backend/admin) with a safe placeholder value.
3. Add a row to the table above.
4. Never add a variable that isn't read anywhere — an undocumented or unused variable is worse
   than no variable.
