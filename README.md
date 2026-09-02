# AstroAI

AI astrology platform: a React Native mobile app, an Express + TypeScript backend, and a
Next.js admin panel, sharing a `packages/shared-types` package. See
[`CLAUDE.md`](CLAUDE.md) for the full product/engineering spec and
[`ARCHITECTURE.md`](ARCHITECTURE.md) for the technical design.

**Status:** foundation + authentication/authorization + birth profile & astrology domain + AI
Gateway + AI astrologer intelligence layer + AI astrology chat system implemented. Auth: Google
Sign-In for end users, email+password for admins, RBAC, sessions with refresh rotation. Birth
profiles: full validation (dates, times, timezones, ambiguous/manual locations), a pluggable
`AstrologyEngine` abstraction with caching/persistence — no real calculation provider is wired in
yet, so astrology endpoints return a clear `503` until one is configured (see
docs/ENVIRONMENT.md's "Astrology engine"). AI Gateway: real OpenAI/Anthropic/Gemini provider
adapters behind a single interface, model-alias routing with retry/fallback/timeout and usage
tracking. AI astrologer: intent/language detection, a configurable persona, astrology-grounded
prompt assembly, and two independent safety layers (a deterministic pre-generation crisis/
self-harm gate that never calls the AI at all, plus a post-generation scan for guarantee/death/
diagnosis language) — see ARCHITECTURE.md §5a. Chat: conversations, messages, realtime delivery
over Socket.IO (durable-then-chunked-replay "streaming", so app termination mid-response never
loses anything), retry/regenerate, feedback, suggested questions, idempotent sends, and the full
mandated pipeline (intent → context → astrology data → AI Gateway → safety validation → response)
— see ARCHITECTURE.md §5b. No admin UI edits AI routing/persona config yet, though the service
layers exist (see docs/ENVIRONMENT.md's "AI Gateway"). Other product features (wallet, payments,
reports, voice, notifications, ...) are not implemented yet — chat billing has a documented,
structurally-anchored integration point for the future wallet module but nothing charges credits
anywhere in this codebase today.

## Prerequisites

- Node.js >= 22.11 (see `.nvmrc`)
- npm >= 10 (workspaces)
- MongoDB (local `mongod` or Atlas) and Redis, for running the backend
- Xcode + CocoaPods (iOS) and/or Android Studio (Android), for running the mobile app

## Setup

```bash
npm install
npm run build:shared-types   # other workspaces resolve @astroai/shared-types via its dist/ output
```

Copy each app's environment template and fill in local values — see
[`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for what every variable means:

```bash
cp backend/.env.example backend/.env
cp admin/.env.example admin/.env.local
```

Mobile has no `.env` file — see `mobile/src/config/env.ts` and `docs/ENVIRONMENT.md`.

MongoDB **must run as a replica set** (Atlas clusters always are) — auth uses multi-document
transactions, which a plain standalone `mongod` rejects. See the comment in
`backend/.env.example` for running one locally.

Create the first admin account (see docs/ENVIRONMENT.md for details):

```bash
ADMIN_SEED_EMAIL=you@astroai.app ADMIN_SEED_PASSWORD='a-real-password-12+chars' ADMIN_SEED_NAME="Your Name" \
  npm run seed:admin --workspace=backend
```

Google Sign-In needs a real Google Cloud OAuth client before it works end-to-end — see
docs/ENVIRONMENT.md's "Google Sign-In setup". Without it, the backend and admin/RBAC layers are
still fully testable (see Tests below); only the mobile sign-in flow itself needs it.

## Running each app

```bash
npm run dev --workspace=backend    # http://localhost:4000, needs MongoDB (replica set) + Redis running
npm run dev --workspace=admin      # http://localhost:3000
npm run ios --workspace=mobile     # or: npm run android --workspace=mobile
```

## Tests

```bash
npm run test --workspace=backend   # Vitest — auth, birth profiles, location, astrology, AI Gateway, AI astrologer, chat (212 tests, in-memory MongoDB + mocked Redis, no setup needed)
npm run test --workspace=admin     # Vitest — login form, API client refresh/retry, auth store
npm run test --workspace=mobile    # Jest — auth store, API client, LoginScreen, birth profile form, time helpers, conversation list, chat screen (55 tests)
```

## Checks

Run from the repo root to check every workspace:

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Repository layout

```
AstroAI/
├── backend/            Express + TypeScript modular monolith (see ARCHITECTURE.md §2)
├── admin/               Next.js admin panel (see ARCHITECTURE.md §3)
├── mobile/              React Native CLI app (see ARCHITECTURE.md §1)
├── packages/
│   └── shared-types/    Cross-cutting types/Zod schemas shared across all three apps
├── docs/
│   └── ENVIRONMENT.md   Every environment variable, per app
├── CLAUDE.md             Product/engineering rules
└── ARCHITECTURE.md       Technical design and open decisions
```
