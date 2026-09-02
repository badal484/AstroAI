# AstroAI — Architecture

Status: **Design baseline v0.1** — no application code exists yet. This document defines the
target architecture before any implementation begins, per `CLAUDE.md` §53 (Implementation
Discipline). It will be revised as decisions are confirmed; open items are marked `TBD`.

Stack mandate (fixed): React Native CLI + TypeScript (mobile) · Node.js + Express + TypeScript
(backend) · MongoDB Atlas + Mongoose (database) · Redis + BullMQ + Socket.IO (infra) ·
Next.js + TypeScript + Tailwind + shadcn/ui (admin) · provider-independent AI Gateway.
**Modular monolith — no microservices**, no exceptions without explicit justification.

---

## 0. Repository Layout

Monorepo, three top-level apps sharing a types package:

```
AstroAI/
├── backend/            Express + TypeScript modular monolith
├── admin/               Next.js admin panel
├── mobile/              React Native CLI app
├── packages/
│   └── shared-types/    Domain types, Zod schemas, enums shared across apps
├── CLAUDE.md
└── ARCHITECTURE.md
```

`shared-types` is published only as a workspace package (npm/pnpm/yarn workspaces or a Turborepo
— TBD, see Open Decisions). It contains no runtime logic, only types/schemas, so it is safe to
import from mobile, backend and admin without pulling server-only code into the client bundle.

---

## 1. Mobile Architecture

**Layering:** Screen → Hook (TanStack Query / Zustand) → API client → Backend `/api/v1/...`.
Screens never call `fetch`/`axios` directly and never contain business rules — business rules
belong to the backend, per CLAUDE.md §6. The mobile app is a thin, presentation-focused client.

**State:**

- Server state (chat messages, wallet balance, reports, profile) → **TanStack Query**, with
  query keys namespaced by user + resource, and cache invalidation driven by mutation results
  and Socket.IO events (see Realtime below).
- Client/UI state (draft form input, active tab, modal visibility, in-progress voice session
  UI) → **Zustand**, kept intentionally small and non-persistent unless a value must survive
  app restarts (see MMKV below).
- Persistent local state (auth tokens, selected language, onboarding flags, cached last-known
  wallet balance for optimistic UI) → **MMKV**, never AsyncStorage. Auth tokens specifically go
  into MMKV with encryption enabled (`react-native-mmkv` encryption key), not into plain
  storage.

**Navigation:** React Navigation, native-stack + bottom-tabs. Auth state (token present/valid)
gates a top-level `Auth` vs `App` navigator swap. Deep links and push-notification taps resolve
to a single linking config so both entry paths land on the same screens (CLAUDE.md §46).

**Realtime:** Socket.IO client, one connection per authenticated session, reconnect-with-backoff.
Used for: streaming chat tokens, voice session state, live wallet balance updates, report-ready
push. The socket is a _supplement_ to TanStack Query cache invalidation, not a replacement for
REST reads — on reconnect after backgrounding, the client re-fetches via query invalidation
rather than trusting missed socket events.

**Forms & validation:** React Hook Form + Zod resolvers, using the _same_ Zod schemas from
`packages/shared-types` that the backend validates against, so client and server never drift.

**Styling:** NativeWind (Tailwind-for-RN) chosen over ad-hoc StyleSheet to keep spacing/color/
typography tokens consistent with the admin panel's Tailwind config and enforce CLAUDE.md §54's
consistency requirement. A shared design-token source (colors, spacing scale, radii) should
live in `packages/shared-types` or a dedicated `packages/design-tokens` — **TBD**, see Open
Decisions.

**Error/loading/empty states:** every screen that fetches data implements three states
explicitly (loading skeleton, empty state with a next action, error state with retry) — no
screen ships with only a happy path, per CLAUDE.md §43/§52.

**Offline/interruption handling (CLAUDE.md §45–46):** mutations that are financially or
state-sensitive (chat send, wallet top-up, report purchase) carry a client-generated
idempotency key (UUID) attached to the request; on retry after timeout/app-kill, the same key
is resent so the backend can dedupe. Streaming chat responses track a `messageId` so an
interrupted stream resumes/rehydrates from persisted messages rather than re-sending.

---

## 2. Backend Architecture

**Modular monolith**, one Express process, one deployable unit, hard module boundaries enforced
by folder structure + lint rules (no deep cross-module imports — only through each module's
public `index.ts`).

**Layering per module** (CLAUDE.md §6):

```
routes/*.routes.ts        →  thin, versioned, wires validation + controller
controllers/*.controller.ts →  parses req, calls service, shapes response — no business logic
services/*.service.ts      →  business logic, orchestration, transactions
repositories/*.repository.ts → Mongoose queries only, no business logic
domain/                    →  pure functions/entities, no I/O (e.g. pricing math, wallet ledger rules)
```

**Directory skeleton:**

```
backend/src/
├── app.ts                 Express app assembly (middleware, routers) — no listen()
├── server.ts               Entry point: loads config, connects Mongo/Redis, starts app
├── config/                 Env loading + Zod validation, typed config object
├── modules/
│   ├── auth/
│   ├── users/
│   ├── profiles/
│   ├── birthProfiles/
│   ├── astrology/
│   ├── ai/
│   ├── chat/
│   ├── voice/
│   ├── wallet/
│   ├── pricing/
│   ├── payments/
│   ├── reports/
│   ├── compatibility/
│   ├── horoscope/
│   ├── notifications/
│   ├── promotions/
│   ├── referrals/
│   ├── analytics/
│   ├── support/
│   ├── admin/
│   ├── featureFlags/
│   └── auditLogs/
├── middleware/              requestId, auth, error handler, rate limit, validation
├── lib/                     redis client, mongo client, socket.io setup, queue registry
├── jobs/                    BullMQ worker entry points (one process or in-process — TBD)
└── shared/                  cross-cutting utils with no business meaning (logger, http errors)
```

Each `modules/<name>/` follows: `<name>.routes.ts`, `<name>.controller.ts`, `<name>.service.ts`,
`<name>.repository.ts`, `<name>.model.ts` (Mongoose schema), `<name>.types.ts`,
`<name>.validation.ts` (Zod), `index.ts` (public exports only).

**Cross-module communication:** modules call each other's _service_ layer directly (in-process
function calls — this is a monolith, not message passing), imported only via the target
module's `index.ts`. Modules must not reach into another module's repository or model directly.
Where true decoupling matters (e.g. wallet debited → notification fired), an in-process event
emitter or BullMQ job is used instead of a direct call, so the wallet module doesn't need to
know notifications exist (CLAUDE.md §29 event-driven notifications).

**API versioning:** all routes mounted under `/api/v1/...` in `app.ts`; a future breaking change
adds `/api/v2/...` alongside, not in place of, v1 (CLAUDE.md §37).

**Response envelope (fixed shape, applies to every endpoint):**

```ts
// success
{ success: true, data: T, requestId: string }
// error
{ success: false, error: { code: string, message: string, details?: unknown }, requestId: string }
```

**Correlation IDs:** middleware assigns/propagates `x-request-id` on every request (accepts an
inbound header from the mobile/admin client for cross-service tracing, generates one if absent),
attaches it to the logger context (AsyncLocalStorage-based), includes it in every response
envelope and every log line, per CLAUDE.md §33/§39.

**Error handling:** typed `AppError` hierarchy (`NotFoundError`, `ValidationError`,
`UnauthorizedError`, `PaymentError`, etc.) carrying an `httpStatus` and stable `code`; a single
centralized Express error middleware maps these to the response envelope and never leaks stack
traces to the client, logging full detail server-side keyed by `requestId` (CLAUDE.md §39).

**Validation:** Zod schemas per route (body/params/query), generated/shared with mobile+admin
via `packages/shared-types` where the payload shape is genuinely shared; request-only shapes
stay local to the backend module.

**Security middleware baseline:** `helmet`, CORS allowlist (mobile app has no browser origin —
CORS restricts admin/web origins; mobile auth relies on token + rate limiting instead), request
body size limits, `express-rate-limit` backed by Redis store (shared limiter state across
instances), input sanitization at the Zod layer (no separate sanitizer needed if Zod schemas
are strict — `.strict()` objects, explicit enums).

**Logging:** structured JSON logs (pino), one logger instance carrying `requestId`, `userId`
(when authenticated), `module`. No `console.log` in application code. Sensitive fields
(passwords, tokens, payment payloads, full chat content) are never logged (CLAUDE.md §36).

---

## 3. Admin Architecture

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, deployed as a separate app from the
backend, calling the same `/api/v1/...` backend over HTTPS with admin-scoped JWTs (not shared
with end-user tokens — separate admin auth, see §14).

**Structure:**

```
admin/src/
├── app/
│   ├── (auth)/login
│   └── (dashboard)/
│       ├── users/  wallet/  payments/  pricing/  ai/  astrology/  reports/
│       ├── compatibility/  voice/  notifications/  campaigns/  promotions/
│       ├── referrals/  content/  feature-flags/  analytics/  support/
│       └── audit-logs/  settings/
├── components/         shared shadcn-based components (DataTable, ConfirmDialog, etc.)
├── lib/                admin API client, auth session handling
└── server/             Next.js route handlers acting as a thin BFF only where needed (rare — prefer calling backend directly)
```

Each resource area follows a consistent pattern: list (search/filter/sort/paginate via
TanStack Query) → detail/edit (React Hook Form + Zod) → destructive actions behind a
`ConfirmDialog` → success/error toast, satisfying CLAUDE.md §48. Charts via Recharts pull from
backend analytics aggregation endpoints, never compute aggregates client-side.

**RBAC in the UI:** the admin session carries the admin's role + permission set (from backend);
navigation items and actions are conditionally rendered based on permissions, but this is a UX
convenience only — the backend is the actual enforcement point (never trust the client, CLAUDE.md
§37).

---

## 4. Database Architecture (MongoDB Atlas + Mongoose)

**One database, modular collections** — no per-module database separation (that would be a step
toward microservices, out of scope). Collection ownership maps 1:1 to backend modules; only the
owning module's repository writes to a collection.

**Core collections (indicative, not exhaustive — finalized per-module during implementation):**
`users`, `birthProfiles`, `conversations`, `messages`, `walletTransactions` (immutable ledger,
append-only), `walletBalances` (derived/cached current balance, reconciled from the ledger —
never the source of truth), `pricingConfigs` (versioned), `payments`, `reports`,
`compatibilityReports`, `horoscopes`, `notifications`, `notificationPreferences`,
`promotions`/`coupons`, `referrals`, `adminUsers`, `adminRoles`, `auditLogs`, `featureFlags`,
`aiProviderConfigs`, `aiUsageEvents`.

**Rules (CLAUDE.md §47):**

- Every collection queried by non-`_id` fields gets an explicit compound index matching real
  query patterns (e.g. `messages: { conversationId, createdAt }`).
- No unbounded arrays (e.g. messages are their own collection referencing `conversationId`,
  not embedded in a conversation document).
- All list endpoints are cursor- or offset-paginated; no "load everything" queries.
- Analytics use aggregation pipelines against source collections or, once volume warrants it,
  scheduled BullMQ jobs that roll up into precomputed `analyticsDaily`-style collections — **TBD**
  on when rollups become necessary (see Open Decisions/Risks).

**Financial data integrity (CLAUDE.md §24):** wallet balance changes use MongoDB **multi-document
transactions** (ledger insert + balance update in one session) to guarantee atomicity, since
these are two separate collections. Double-spend prevention relies on the transaction plus an
idempotency key check (see §38) before any debit/credit is applied.

---

## 5. AI Gateway Architecture

Hard boundary (CLAUDE.md §8): **no module ever imports a provider SDK directly.** Everything
goes through `modules/ai`.

```
Caller (chat, reports, horoscope, notifications-copy, ...)
        │  generateText() / streamText() / generateStructured() / classifyIntent() / generateEmbedding()
        ▼
AI Gateway (modules/ai/gateway)
        │  resolves logical alias → provider+model via ModelRouter
        ▼
Model Router (modules/ai/router)
        │  reads admin-configured routing table (DB-backed, cached in Redis)
        │  picks primary provider; on failure classifies error → retries eligible fallback
        ▼
Provider Adapter (modules/ai/providers/{openai,anthropic,gemini}.adapter.ts)
        │  implements a common ProviderAdapter interface
        ▼
Provider SDK
```

**`ProviderAdapter` interface** (shape, not final code): `generateText`, `streamText`,
`generateStructured` (JSON-schema-constrained), `classifyIntent`, `generateEmbedding` — each
adapter implements the subset it supports; the router knows adapter capabilities from config so
it never routes an alias to a provider that can't fulfill it.

**Model aliases** (CLAUDE.md §9): `fast-chat`, `smart-chat`, `reasoning`, `voice-chat`,
`report-generation`, `summarization`, `classification`. Alias → provider/model mapping lives in
an admin-editable `aiProviderConfigs` collection, cached in Redis with short TTL + invalidated on
admin write, so a config change takes effect without a redeploy.

**Fallback (CLAUDE.md §10):** router wraps each provider call with a timeout; on timeout, rate
limit (429), or 5xx-class provider error, it retries against the next configured fallback for
that alias (bounded attempts, no infinite retry). All provider-specific errors are caught and
normalized to a generic `AIGatewayError` before reaching callers — callers/users never see raw
provider error text.

**Observability:** every gateway call emits an `aiUsageEvents` record — requestId, alias,
provider, model, latency, success/failure, fallback-used, token usage (when provider returns
it), estimated cost (computed from admin-configured per-model rates), error category. This feeds
admin AI-cost analytics (CLAUDE.md §10/§49) and is written asynchronously (fire-and-forget via a
queue) so logging never adds latency to the user-facing response.

**Streaming:** `streamText()` returns an async iterable/Node stream abstraction independent of
provider-specific streaming formats (SSE vs provider SDK stream), normalized once inside each
adapter; the chat module relays normalized chunks over Socket.IO to the client.

**Astrology data injection:** callers (chat/report services) fetch verified facts from the
Astrology Engine first, then pass them into `generateText`/`generateStructured` as structured
context — the AI Gateway itself has no knowledge of astrology and never receives a bare user
question without the calculated facts already attached, enforcing CLAUDE.md §11.

---

## 6. Astrology Engine Architecture

Deterministic, authoritative, **not an LLM call** — a pure calculation module (or, if a
third-party ephemeris/astrology API is used, a thin server-side adapter around it — **TBD**,
see Open Decisions: build vs. integrate).

```
modules/astrology/
├── astrology.service.ts     public API: getChart(), getDasha(), getTransits(), getCompatibilityScore(), ...
├── engine/                  pure calculation logic (or adapter to a licensed ephemeris library/API)
├── astrology.repository.ts  persisted chart snapshots (cache of computed charts per birthProfile)
└── astrology.types.ts       Chart, PlanetPosition, House, Nakshatra, Dasha, Yoga, Transit, CompatibilityScore
```

**Design decisions:**

- Computed charts are cached/persisted keyed by `birthProfileId` + calculation version, so
  results are stable and cheap to re-read; a version bump (engine correction/upgrade) can force
  recomputation without silently changing historical report content already delivered to users.
- The service returns typed, structured facts only — no natural-language text. Interpretation
  in natural language is entirely the AI Gateway's job, fed these facts (CLAUDE.md §11).
- Unknown/approximate birth time (CLAUDE.md §20) is a first-class input: the engine returns a
  `confidence`/`precision` flag per fact set (e.g. house cusps and ascendant are unreliable
  without exact time) so downstream callers (AI, reports) can express appropriate uncertainty
  rather than presenting a guess as fact.

**Open decision (flagged as a risk below):** whether calculations are implemented in-house
(e.g. via a Swiss Ephemeris binding) or sourced from a licensed third-party astrology
calculation API. This materially affects the `engine/` internals but not the module's public
interface, so it can be decided/swapped without touching callers.

---

## 7. Wallet Architecture

```
modules/wallet/
├── wallet.service.ts       credit(), debit(), getBalance(), reserve()/release() for holds
├── wallet.repository.ts
├── ledger.model.ts          walletTransactions — append-only, immutable
└── balance.model.ts         walletBalances — derived cache, reconciled from ledger
```

Every credit/debit (CLAUDE.md §24):

1. Validates an idempotency key (caller-supplied, e.g. `payment:{paymentId}`,
   `chat:{messageId}`, `voice:{sessionId}:{tick}`) against a uniqueness index on
   `walletTransactions` — a duplicate key short-circuits and returns the original result instead
   of double-applying.
2. Opens a MongoDB session/transaction.
3. Inserts the ledger row with `balanceBefore`/`balanceAfter` computed from the current balance
   read inside the transaction (preventing lost updates under concurrency).
4. Updates the cached balance document in the same transaction.
5. Commits atomically; on any failure the whole operation rolls back — no partial state.

**Debit-before-use pattern** for metered features (chat, voice): a `reserve()` step holds funds
before the AI/voice call executes; on success it's converted to a real debit (or adjusted to
actual usage for voice per-second billing); on failure the reservation is released and the user
is not charged (CLAUDE.md §23/§26). Concurrent debit attempts on the same wallet are serialized
via the Mongo transaction's optimistic concurrency (retry-on-conflict) rather than an external
lock, since MongoDB transactions already provide the needed isolation; a Redis distributed lock
is used only if profiling later shows transaction retry contention is a problem (CLAUDE.md §41 —
Redis is not the financial source of truth).

---

## 8. Pricing Architecture

```
modules/pricing/
├── pricing.service.ts      getActivePrice(feature, context), no caller ever hardcodes a number
├── pricing.repository.ts
└── pricingConfig.model.ts   versioned, effective-dated
```

`pricingConfigs` documents are versioned and effective-dated (`effectiveFrom`/`effectiveTo`),
never mutated in place once active — an admin "price change" inserts a new version and
supersedes the prior one, satisfying CLAUDE.md §25's requirement that historical transactions
retain the config in effect at transaction time. Every financial transaction (wallet ledger row,
payment, report purchase) stores a snapshot of the `pricingConfigId`/version actually applied,
not a live reference, so a later price change cannot retroactively alter what a past
transaction "cost." Redis caches the currently-active config per feature (short TTL +
write-invalidation) so the hot path (every chat message, every voice tick) isn't hitting Mongo
per request.

Scheduled pricing (future `effectiveFrom`) is activated by a BullMQ scheduled job that flips the
active-version pointer and busts the Redis cache — not by a request-time "is it time yet" check
scattered across callers.

---

## 9. Payment Architecture (Razorpay)

```
modules/payments/
├── payments.controller.ts   initiate order, webhook receiver
├── payments.service.ts      order creation, verification, reconciliation
├── payments.repository.ts
└── payment.model.ts          status machine: created → attempted → paid/failed → refunded/partially_refunded
```

**Authority model (CLAUDE.md §27):** client-reported payment success is _never_ trusted to
credit a wallet or unlock a report. Only two things move a payment to `paid`:

1. Razorpay **webhook** (`payment.captured`/`order.paid`), signature-verified server-side using
   the Razorpay webhook secret, or
2. A server-side verification call back to Razorpay if the client returns a payment ID (used
   only to _check_ status, never to trust the client's claim of success).

**Idempotency:** the Razorpay `event.id` (or `payment.id` for direct verification) is stored with
a uniqueness constraint; a re-delivered webhook (retry, duplicate) is detected and a no-op
response returned instead of re-crediting the wallet — this is what makes wallet credit-on-
payment safe (ties into §7/§38).

**Reconciliation:** a scheduled BullMQ job periodically compares Razorpay's order/payment list
against local `payments` records to catch any webhook that was never delivered (network issue,
downtime), closing the gap between "app crashed after payment but before webhook processed"
(CLAUDE.md §27/§45) — flags mismatches for admin review rather than auto-crediting silently.

**Refunds:** admin-initiated (CLAUDE.md §32 — Finance role), calls Razorpay refund API, writes a
`refund` ledger transaction (negative, referencing the original payment), supports partial
refunds where Razorpay allows them for the payment method used.

---

## 10. Voice Architecture

```
modules/voice/
├── voice.service.ts        session lifecycle: start(), tick()/heartbeat, end()
├── voice.gateway.ts          Socket.IO namespace for real-time audio session signaling
└── voiceSession.model.ts
```

A voice session is billed incrementally, not as one lump sum at the end (protecting both the
user from a runaway charge and the business from an unbillable free session):

- On session start: check balance covers at least the configured minimum charge / free initial
  duration; reserve funds.
- On a server-driven heartbeat tick (interval matches the configured billing unit —
  per-second/30-second/minute from `pricingConfig`), debit incrementally via the wallet's
  reserve/convert pattern, each tick carrying an idempotency key (`voice:{sessionId}:{tickSeq}`)
  so a duplicate tick event (retry, reconnect) cannot double-charge (CLAUDE.md §26/§38).
- If balance is exhausted mid-session: session is gracefully ended server-side (not abruptly
  dropped without explanation) and the client is notified with a clear "top up to continue"
  state, not a silent disconnect (CLAUDE.md §44).
- Max session duration is enforced server-side regardless of client behavior.
- On any failure/disconnect, billing stops at the last successfully-processed tick — the AI
  voice provider call and the billing tick are reconciled so a failed generation tick is not
  charged (CLAUDE.md §26).

The underlying voice AI call goes through the AI Gateway's `voice-chat` alias like any other AI
call — the voice module does not talk to a speech provider SDK directly, keeping provider
independence.

---

## 11. Notification Architecture

Event-driven, decoupled from the modules that trigger events (CLAUDE.md §29):

```
Any module (wallet, chat, reports, users, ...)
        │  emits a domain event (in-process EventEmitter or a BullMQ "notifications" queue job)
        ▼
modules/notifications/
├── notification.service.ts   resolves recipient + channel(s) + template + language
├── notification.repository.ts
├── preferences.service.ts     opt-out, quiet hours, frequency caps, language
└── channels/
    ├── push.channel.ts        (FCM/APNs via a push provider — TBD)
    ├── email.channel.ts       (TBD provider)
    └── sms.channel.ts         (TBD provider, optional at launch)
```

Emitting modules never call a channel directly and never know delivery details — they emit
`{ eventType, userId, payload }`; the notifications module resolves _whether_ to send (respecting
preferences/quiet hours/frequency caps/opt-out, CLAUDE.md §29), _what_ to send (templated,
localized per user's language, CLAUDE.md §18), and _how_ (channel selection/fallback).

All actual sends happen via BullMQ jobs (retryable, observable, per CLAUDE.md §42), not
synchronously inside the request that triggered the event — a notification failure must never
fail or slow down the triggering user action (e.g. a report-ready push failing doesn't affect
the report being marked ready).

Campaign/promotional sends (bulk) reuse the same channel adapters but are queued in batches with
per-user dedup keys to prevent double-sends across overlapping campaigns (CLAUDE.md §29
"campaign deduplication").

---

## 12. Promotion Architecture

```
modules/promotions/
├── promotions.service.ts     validateCoupon(), applyCoupon(), redemption tracking
├── promotions.repository.ts
└── coupon.model.ts             code, type, value, usageLimit, perUserLimit, minPurchase, expiry, segment, active
modules/referrals/
├── referrals.service.ts       generateCode(), redeem(), reward payout
└── referral.model.ts
```

Coupon redemption and referral reward payout are wallet credits, so they flow through the same
idempotent wallet `credit()` path as any other transaction (§7) — a redemption attempt is itself
idempotent per `(userId, couponCode)` to prevent replay.

**Abuse prevention (CLAUDE.md §31):** referral self-redemption is blocked by comparing referrer/
referee identity signals available at signup (device ID, phone number where collected — exact
signal set is a product/legal decision, **TBD**); per-user and global usage limits are enforced
transactionally at redemption time (not just at display time) so a race between two concurrent
redemption attempts can't both succeed past a limit — this uses the same Mongo-transaction +
uniqueness-index pattern as wallet idempotency.

---

## 13. Analytics Architecture

```
modules/analytics/
├── analytics.service.ts       trackEvent(), query aggregation endpoints for admin
├── events.model.ts             append-only event stream (registrations, activation, purchases, ...)
└── aggregation/                 scheduled BullMQ rollups → precomputed daily/weekly summary collections
```

Product events (CLAUDE.md §49) are written append-only and cheap at write time (fire-and-forget,
queued); admin-facing charts read from precomputed rollups where volume warrants it rather than
aggregating the raw event stream on every dashboard load — the threshold for introducing rollups
is a **TBD** operational decision made once real volume exists (flagged under Risks).

AI cost/latency/failure metrics reuse the `aiUsageEvents` stream from the AI Gateway (§5) rather
than a separate tracking mechanism. Analytics collection is designed to avoid unnecessary PII —
events reference `userId` but do not duplicate profile/chat content into the event payload
(CLAUDE.md §49/§56).

---

## 14. Authentication / Authorization Architecture

**Two entirely separate auth systems**, not shared tokens/roles:

**End-user auth (mobile):**

- JWT access token (short-lived) + refresh token (longer-lived, rotated on use, stored server-
  side hashed to allow revocation), issued by `modules/auth`.
- Mobile stores tokens in encrypted MMKV, never in plain AsyncStorage (CLAUDE.md §36).
- Auth methods at minimum: phone/OTP (typical for the Indian market this product targets) and/or
  email — exact primary method is a **TBD** product decision (see Open Decisions).
- Token refresh handled by an API-client interceptor; expired-refresh forces re-login, satisfying
  CLAUDE.md §46 (auth expiration handling).

**Admin auth (admin panel):**

- Separate `adminUsers` collection, separate JWT audience/signing context from end-user tokens
  (so an end-user token can never be replayed against admin routes and vice versa).
- Backed by RBAC: `adminRoles` define named roles (super admin, operations, support, finance,
  marketing, content, AI manager, analyst — CLAUDE.md §32) as permission sets; a permission
  middleware (`requirePermission('wallet:adjust')` etc.) guards every sensitive admin route —
  authorization is enforced at the backend route/service layer, the admin UI's conditional
  rendering (§3) is UX only.
- Every admin authentication event and every sensitive action is written to `auditLogs`
  (CLAUDE.md §33), including actor, action, target, timestamp, metadata, and IP/device where
  legally appropriate (jurisdiction-specific — **TBD**, see Privacy/Risks).

Authorization middleware is shared infrastructure (`middleware/auth.ts`,
`middleware/requirePermission.ts`) but configured with two distinct token verification contexts
so the two systems cannot cross-authenticate.

---

## 15. Security Architecture

- **Secrets:** never in the mobile app (CLAUDE.md §36) — all provider keys, Razorpay secret,
  JWT signing secrets live server-side only, loaded from environment variables validated at boot
  (fail-fast on missing/malformed config, not a runtime surprise).
- **Transport:** HTTPS everywhere in every non-local environment; mobile pins to the production
  API host per environment config.
- **Headers/CORS:** `helmet` defaults plus an explicit CORS allowlist for the admin origin(s);
  mobile traffic isn't browser-originated so CORS is not a mobile concern, but the same backend
  serving admin needs a strict allowlist (not `*`).
- **Rate limiting:** Redis-backed, tiered — stricter limits on auth endpoints (login/OTP), chat
  send, and payment-initiation than on read endpoints; per-IP and per-user where applicable.
- **Input validation:** Zod at every route boundary; MongoDB queries built only through Mongoose
  (no raw query string interpolation) to avoid injection.
- **Abuse protection:** OTP rate limiting/backoff, coupon/referral abuse checks (§12), voice/chat
  usage anomaly signals feeding into admin analytics for manual review (automated
  suspension/banning stays an explicit admin action, not silent auto-ban, to avoid wrongly
  locking out legitimate users — **TBD** on any automated triggers).
- **Data-at-rest:** MongoDB Atlas encryption at rest (platform-provided); MMKV encryption on
  mobile for tokens; no plaintext secrets in any config file committed to the repo (`.env.example`
  documents variable names only, never real values, per CLAUDE.md §51/this task's "no fake
  production secrets" instruction).
- **Logging discipline:** structured logs exclude passwords, tokens, payment secrets, and full
  chat content by default (CLAUDE.md §36) — log redaction is enforced centrally in the logger
  config, not left to each call site's discretion.

---

## 16. Testing Architecture

- **Unit tests** (Jest/Vitest — **TBD**, pick one and use consistently across backend/admin):
  pure domain logic first — pricing calculation, wallet ledger math, astrology engine functions,
  coupon validation rules, AI Gateway fallback selection logic. These require no DB/network and
  run fast.
- **Integration tests:** service + repository against a real MongoDB (e.g. `mongodb-memory-
server` or a dedicated test Atlas cluster — **TBD**) for modules with real query/transaction
  behavior: wallet, payments, promotions, referrals.
- **Contract/adapter tests:** AI provider adapters and the Razorpay adapter are tested against
  recorded fixtures/mocks at the adapter boundary — CLAUDE.md §51 forbids faking success
  responses _in production code_, but test doubles at the adapter boundary in test code are
  correct practice and not the same thing.
- **API/e2e tests (backend):** supertest-style tests hitting `/api/v1/...` for auth, wallet,
  payments (webhook simulation with valid/invalid signatures, duplicate delivery), pricing
  snapshot behavior, permission enforcement on admin routes.
- **Priority order** given CLAUDE.md §50's emphasis: auth → wallet → pricing → payments/refunds
  → AI fallback → voice billing → coupons/referrals → notifications → permissions → report
  generation.
- **Mobile:** component/unit tests for critical flows (auth, payment confirmation UI, wallet
  display) with RN Testing Library; full e2e (Detox/Maestro) is a **TBD** stretch goal, not
  required for foundation phase.
- CI enforcement (lint + typecheck + test on every PR) is set up once the app skeletons exist —
  covered in the immediately-following implementation phase, not this document.

---

## 17. Deployment Architecture

- **Backend:** single Node process (modular monolith) behind a process manager, horizontally
  scalable behind a load balancer since state (sessions, wallet locks) lives in Mongo/Redis, not
  in-process — multiple instances are safe. Socket.IO requires either sticky sessions or a Redis
  adapter (`socket.io-redis`/`@socket.io/redis-adapter`) for cross-instance broadcast once scaled
  beyond one instance — **must** use the Redis adapter from day one if more than one instance is
  ever expected, to avoid a painful retrofit.
- **BullMQ workers:** can run in-process with the API server initially, split into a separate
  worker process/deployment once job volume warrants it — **TBD** on timing, flagged as a Risk
  below since it affects how `jobs/` is structured from the start (should be structured to allow
  extraction without rewrite, even if run in-process initially).
- **Admin:** deployed separately from the backend (independent Next.js deployment), talking to
  the backend over HTTPS — never given direct DB access.
- **Mobile:** standard RN CLI release builds (App Store / Play Store), environment-specific API
  base URLs baked in per build config (dev/staging/prod), no secrets bundled (§15).
- **Environments:** at minimum `development`, `staging`, `production`, each with isolated Mongo
  Atlas cluster/DB, isolated Redis instance, and isolated provider API keys (AI providers,
  Razorpay test vs live keys) — config validated per-environment at boot.
- **Config/secrets management:** environment variables, validated via a Zod-based config schema
  at process start (fail fast); actual secret storage/injection mechanism (platform env vars vs.
  a secrets manager) is deployment-target-dependent — **TBD** until a hosting target is chosen
  (see Open Decisions).

---

## Risks, Missing Decisions & Dependencies

**Open product/technical decisions (block or shape near-term implementation):**

1. **Astrology calculation source** — build in-house (e.g. Swiss Ephemeris binding) vs. license
   a third-party astrology API. Affects `modules/astrology/engine` internals, cost, accuracy, and
   latency; does not affect its public interface, so it can be deferred but should be decided
   before report/chat features are built on top of it.
2. **Primary auth method** for end users (phone/OTP vs. email vs. both) — affects `modules/auth`
   design and the OTP-delivery dependency (SMS provider).
3. **Push/email/SMS provider selection** (`modules/notifications/channels/*`) — no vendor chosen
   yet; each channel is an adapter so the choice is isolated, but one must be picked before
   notifications can be implemented end-to-end.
4. **Monorepo tooling** — plain npm/yarn/pnpm workspaces vs. Turborepo/Nx for `packages/shared-
types` + three apps. Affects initial scaffold structure (Phase 2 of implementation).
5. **Hosting/deployment target** — determines secrets management, whether BullMQ workers are
   separate processes from day one, and how Socket.IO scaling is configured.
6. **Design token source of truth** for shared visual language between mobile (NativeWind) and
   admin (Tailwind) — a shared tokens package or independent configs kept manually in sync.
7. **Jurisdiction for privacy/audit-log requirements** (what "where legally appropriate" means
   for IP/device logging, data retention, deletion SLAs) — affects `auditLogs` and account-
   deletion design (CLAUDE.md §56).
8. **Referral-abuse detection signals** — what identity signals (device ID, phone, payment
   instrument) are legally/product-acceptable to use for self-referral and multi-account
   detection.
9. **Analytics rollup threshold** — when raw-event aggregation is replaced by precomputed
   rollups; deferrable, but the `analytics` module should be structured so this swap doesn't
   require a rewrite.
10. **Test runner choice** (Jest vs. Vitest) for backend/admin consistency.

**Architectural risks to watch:**

- **Modular-monolith discipline erosion:** the biggest long-term risk to this architecture is
  modules quietly reaching into each other's repositories/models instead of going through public
  service APIs. Mitigate with lint rules (e.g. `eslint-plugin-boundaries` or import restrictions)
  enforced from the start, not retrofitted later.
- **Socket.IO horizontal scaling:** if the Redis adapter isn't wired in before a second backend
  instance is deployed, realtime features (streaming chat, live wallet updates) will silently
  break for users whose socket connects to a different instance than the one processing their
  request. This should be set up even in a single-instance environment to avoid a scaling
  surprise later.
- **Wallet/payment concurrency correctness** is the highest-consequence area in the whole system
  (real money) — needs the most thorough test coverage before any real Razorpay integration goes
  live, and should be reviewed specifically for race conditions beyond what this document can
  fully specify on paper.
- **AI Gateway becoming a leaky abstraction:** if even one caller imports a provider SDK "just
  this once," the provider-independence guarantee (CLAUDE.md §8) is broken silently. Should be
  enforced via lint/import restrictions, not just convention.
- **Pricing/versioning correctness under concurrent admin edits:** two admins changing pricing
  near-simultaneously could create overlapping `effectiveFrom` windows; needs a clear conflict
  rule (e.g. last-write-wins with an audit trail, or optimistic locking) decided before the
  pricing module is built, not discovered in production.

**Dependencies implementation will need before certain modules can be completed:**

- Astrology module depends on Decision #1.
- Auth module depends on Decision #2 and an SMS/OTP provider if phone-based.
- Notifications module depends on Decision #3.
- Payments module depends on Razorpay account/credentials (test mode acceptable for development,
  per "do not use fake production secrets" — real Razorpay _test_ keys are required, not fabricated
  ones).
- AI Gateway depends on at least one real provider API key (test/dev tier) to be usable beyond
  interface stubs — CLAUDE.md §51 forbids faking provider responses in production code, so the
  gateway's adapters need genuine (even if low-tier/dev) credentials to be exercised beyond unit
  tests with mocked adapters.

---

## Summary

This document establishes: a three-app monorepo (mobile/backend/admin + shared types); a strict
layered, modular-monolith backend with 21 isolated modules communicating only through public
service interfaces; a provider-independent AI Gateway sitting behind logical model aliases with
admin-configurable routing and fallback; a deterministic, non-LLM astrology engine as the sole
source of astrological fact; an immutable, transactional wallet ledger with idempotent
credit/debit as the financial backbone shared by chat, voice, payments, promotions, and
referrals; versioned, admin-configurable pricing that never rewrites history; webhook-authoritative,
idempotent Razorpay payment handling with reconciliation; an event-driven, preference-aware
notification system decoupled from its triggering modules; two independent auth/RBAC systems for
end users and admins with full audit logging of sensitive admin actions; and a security/testing/
deployment posture built around Redis-backed rate limiting, structured correlation-ID logging,
and horizontal scalability from day one (notably the Socket.IO Redis adapter).

Ten decisions remain open (astrology data source, auth method, notification providers, monorepo
tooling, hosting target, design tokens, jurisdiction/privacy specifics, referral-abuse signals,
analytics rollup timing, test runner) — none block starting the foundational scaffold (project
structure, TypeScript/lint/config setup, error handling, API versioning, security middleware),
but the astrology data source and auth method decisions should be made before their respective
modules are implemented.

No product features have been implemented. Awaiting the next implementation instruction.
