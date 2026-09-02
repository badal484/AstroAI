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

**Implemented**, with real OpenAI, Anthropic and Gemini adapters. Hard boundary (CLAUDE.md §8):
**no module ever imports a provider SDK directly.** Everything goes through `modules/ai`.

```
Caller (chat, reports, horoscope, notifications-copy, ... — none built yet)
        │  aiGateway.generateText() / streamText() / generateStructured() / classifyIntent() / generateEmbedding()
        ▼
AI Gateway (modules/ai/gateway/aiGateway.ts)
        │  validates input, derives a JSON Schema from the caller's Zod schema for structured calls
        ▼
Model Router (modules/ai/router/modelRouter.ts)
        │  aiConfigService.getRoutingCandidates(alias) → ordered provider/model list
        │  per candidate: same-provider retry on transient errors, then fallback to the next
        ▼
Provider Adapter (modules/ai/providers/{openai,anthropic,gemini}.adapter.ts)
        │  implements the shared ProviderAdapter interface; one real client each, built once in registry.ts
        ▼
Provider SDK (openai / @anthropic-ai/sdk / @google/genai)
```

**`ProviderAdapter` interface** (`modules/ai/ai.types.ts`): `generateText`, `streamText`,
`generateStructured` (JSON-Schema-constrained — OpenAI's `response_format`, Anthropic's forced
single tool call, Gemini's `responseJsonSchema`), `generateEmbedding`. Each adapter declares a
`capabilities: Set<AICapability>` (`text_generation`/`streaming`/`structured_output`/
`embedding`) — e.g. Anthropic has no embeddings API, so its adapter simply omits that capability,
and the router skips it as a candidate for any embedding call rather than trying and failing.
`classifyIntent` has no adapter-level implementation at all: it's built once, in the gateway, on
top of `generateStructured` with a fixed `{ intent, confidence }` schema — classification is
just structured generation with a specific shape, so no provider-specific code is needed for it.

**Model aliases** (CLAUDE.md §9): `fast-chat`, `smart-chat`, `reasoning`, `voice-chat`,
`report-generation`, `summarization`, `classification` (`packages/shared-types/src/ai.ts`).
Alias → ordered provider/model candidate list resolves through `aiConfigService
.getRoutingCandidates()`: an admin override in the `aiRoutingConfigs` collection if one exists
(Redis-cached, invalidated on write), else the built-in default in `router/defaultRouting.ts` —
the system works with sensible routing before any admin ever touches it, the same pattern as
`LOCATION_PROVIDER`/`ASTROLOGY_ENGINE_PROVIDER`. **No admin route exists yet** to edit routing
config — `aiConfigService.setRoutingCandidates()` is fully implemented and tested, ready for an
admin controller to call.

**Retry vs. fallback (CLAUDE.md §10/§40):** `providers/classifyError.ts` normalizes every raw
provider error (OpenAI's `APIError`, Anthropic's `APIError`, Gemini's `ApiError` — all expose the
same `.status` convention) into one category, each with its own retry/fallback policy:

| Category                            | Same-provider retry    | Falls back to next candidate |
| ----------------------------------- | ---------------------- | ---------------------------- |
| `timeout`, `server_error`           | yes (1 retry, backoff) | yes                          |
| `rate_limited`, `not_configured`    | no                     | yes                          |
| `authentication`, `invalid_request` | no                     | **no — aborts immediately**  |
| `unknown`                           | yes (lenient)          | yes                          |

Every failure is wrapped in a single `AIGatewayError` (503) once all eligible candidates are
exhausted — callers/users never see raw provider error text. Streaming's fallback window is
narrower than the other calls: once a candidate's first chunk has been pulled successfully, the
caller is committed to that provider (swapping mid-stream isn't possible once output may already
be relayed to a client), so only connection failures are retried/failed-over.

**Observability:** every attempt (success or failure, including ones only a retry/fallback ever
saw) is recorded to the `aiUsageEvents` collection — requestId, alias, provider, model, latency,
success/failure, fallback-used, token usage (when the provider returns it), estimated cost
(`modules/ai/costRates.ts`'s default per-model rate table), error category. Recorded
fire-and-forget (`aiUsageService.record()`, caught/logged on failure, never awaited on the
response path) so logging never adds latency — CLAUDE.md's queue suggestion is deferred until
this codebase has BullMQ infrastructure for anything else; a synchronous fire-and-forget call
already satisfies "never blocks the caller."

**Streaming:** `streamText()` returns an `AsyncIterable` of `{ delta, done }` chunks, provider
formats (OpenAI SSE deltas, Anthropic `content_block_delta` events, Gemini's chunked responses)
normalized once inside each adapter — a future chat module relays these over Socket.IO.

**Structured output:** the gateway accepts a Zod schema, derives a JSON Schema from it
(`zod-to-json-schema`) to send to the provider, then parses and re-validates the provider's raw
JSON response against that same Zod schema before returning — a provider returning malformed or
schema-mismatched JSON surfaces as a clear `AIInvalidRequestError`, never silently trusted as `T`.

**Astrology data injection:** callers (chat/report services, not yet built) fetch verified facts
from the Astrology Engine first, then pass them into `generateText`/`generateStructured` as
structured context — the AI Gateway itself has no knowledge of astrology and never receives a
bare user question without the calculated facts already attached, enforcing CLAUDE.md §11.

---

## 5a. AI Astrologer Intelligence Layer

**Implemented** (`modules/astrologer/`). This is the persona/conversation layer built on top of
the AI Gateway (§5) and Astrology Engine (§6a) — not a generic chatbot wrapper. No caller exists
yet (chat/voice/reports aren't built); this module exposes one function,
`generateAstrologerResponse()`, for a future chat module to call and to own message
persistence/streaming delivery around.

```
generateAstrologerResponse(userMessage, conversationHistory, birthProfileId, ...)
        │
        ▼
1. detectLanguage()            — sync, dependency-free (script + keyword heuristic), CLAUDE.md §18/§19
2. detectIntent()               — deterministic crisis/unsafe gate FIRST, then AI classification
        │  if crisis_self_harm → return a FIXED template response here, no AI call at all (CLAUDE.md §17)
        ▼
3. Context builders (parallel): astrologyContext + conversationContext + userPreferenceContext + reasoningContext
        ▼
4. systemPrompt.ts assembles persona + hard safety rules + language + intent guidance + astrology
   facts + reasoning guidance + conversation memory + user context, in that fixed order
        ▼
5. aiGateway.generateText() (never streamed — see below)
        ▼
6. outputSafetyValidator — regex scan for guarantee/death/human-claim/diagnosis language
        │  unsafe → regenerate once with a corrective instruction → re-validate
        │  still unsafe → replace with a fixed safe fallback response (never surface the unsafe draft)
        ▼
7. responsePostProcessor — strips an opening clause repeated verbatim from the prior assistant turn
```

**Why non-streaming:** the safety validator needs the complete response before anything reaches
the user, so `generateText` (not `streamText`) is used throughout — a future chat module wanting
a "typing" UX would reveal an already-validated response progressively itself, not stream
unvalidated provider output token by token.

**Intent detection is two-stage, not one AI call (CLAUDE.md §17):** stage one is a deterministic,
dependency-free keyword scan (`detection/crisisPatterns.ts`, `unsafePatterns.ts`) for self-harm/
suicide and clearly unsafe requests — it runs unconditionally, before any AI call, and works even
with zero AI providers configured, because the highest-stakes safety gate in the whole system
must never depend on a model correctly classifying a paraphrased crisis message. Stage two (AI
classification via `aiGateway.classifyIntent`) still includes `crisis_self_harm`/`unsafe` as
possible labels as a second-opinion net, and falls back to a keyword heuristic
(`keywordIntentFallback.ts`) if the AI Gateway itself is unavailable, so intent detection degrades
gracefully rather than failing every message when no provider is configured.

**Prompts are files, not strings in a controller:** `prompts/personaPrompt.ts`,
`languageInstructions.ts`, `intentGuidance.ts`, `safetyRules.ts` are each small, independently
readable/editable modules; `systemPrompt.ts` only assembles them in a fixed order (safety rules
placed immediately after the persona, never buried at the end).

**Persona is data, not prose baked into code:** `AstrologerPersona`
(`packages/shared-types/src/astrologer.ts`) has `name`/`description`/`tone`/`personalityTraits`/
`expertise`/`supportedLanguages`/`responseStyle`/`greetingBehavior`/`prohibitedBehaviors` fields.
`persona.service.ts` follows the exact same admin-override-with-built-in-default pattern as
`aiConfigService`/`DEFAULT_AI_ROUTING` (Redis-cached, Mongo-backed override, no admin route yet —
the service layer is ready for one) — `DEFAULT_PERSONA` (`persona/defaultPersona.ts`) is the
initial "Astra" persona and encodes CLAUDE.md §12-17 directly (warm, conversational, honest about
uncertainty, never claims to be human, never guarantees a prediction).

**Astrology facts are supplied, never invented (CLAUDE.md §11):** `context/astrologyContext.ts`
is the ONLY source of chart facts the prompt is allowed to reference — it degrades explicitly and
honestly (never silently) to "no verified data available" when there's no linked birth profile,
the profile can't be found, or the astrology engine itself isn't configured (§6a). Distinct from
this is `context/reasoningContext.ts` — guidance on _which_ traditional chart factors are relevant
to the current intent (e.g. the 7th house and Venus for a marriage question) and explicit
reinforcement that this is guidance about what to look for in the facts already given, never
license to fabricate a factor that wasn't provided.

**Two independent safety layers, not one:** the prompt instructs the model never to produce
guarantee/death/diagnosis/human-claim language (`prompts/safetyRules.ts`), and
`safety/outputSafetyValidator.ts` scans every generated response for that same language
regardless of whether the prompt worked — defense in depth, since a prompt instruction alone is
never a hard guarantee. Crisis language never even reaches this layer: it's intercepted before
generation and answered with a fixed, non-AI-generated template
(`safety/crisisResponses.ts`) precisely because it's the one path where a template is more
reliable than even a well-prompted model.

---

## 5b. Chat System Architecture

**Implemented** (`modules/chat/`). The first real caller of both the AI Gateway (§5) and the AI
Astrologer layer (§5a) — conversations, messages, realtime delivery, and the mandated pipeline
end to end:

```
user message (REST, idempotent on clientMessageId)
        │
        ▼
persist user message (status=complete) + assistant placeholder (status=pending)
return the user message to the caller immediately; generation continues in the background
        │
        ▼
runGeneration(): status → streaming
        │
        ▼
generateAstrologerResponse()   — intent → context → astrology data → AI Gateway → safety validation (§5a)
        │
        ▼
persist COMPLETE content + aiSession to MongoDB FIRST (durable before any client sees it)
        │
        ▼
replay the validated content over Socket.IO as word-chunks, then emit message:complete
```

**Two data models, not three:** `Conversation` (userId, birthProfileId, title, language,
lastMessageAt) and `Message` (role, content, status: pending/streaming/complete/failed, intent,
language, feedback, `aiSession`, `regeneratedFromMessageId`, `clientMessageId`). There is no
separate "AI session" collection — CLAUDE.md's "AI sessions" requirement is satisfied by an
`aiSession` subdocument embedded per assistant message (requestId, provider, model, usedFallback,
safetyCorrectionApplied, latencyMs) rather than a parallel table, since a session's lifetime is
identical to the one message it produced.

**"Streaming" is chunked replay of a durable, validated response — not token streaming from the
provider.** The astrologer layer (§5a) is deliberately non-streaming: the safety validator needs
the complete response before anything reaches the user. So `runGeneration()` calls
`generateAstrologerResponse()` (never `streamText`), writes the complete, validated content to
Mongo with `status=complete` FIRST, and only then replays it to connected clients as small
word-chunks over Socket.IO with a short pacing delay for a genuine "typing" feel. This ordering is
also what makes **"handle app termination during streaming" safe by construction**: nothing is
ever lost, because the full validated response is durable in the database before any client-facing
delivery begins — a killed app simply reconnects and fetches the already-complete message over
REST.

**Realtime delivery is Socket.IO, supplementary to REST, never a replacement for it**
(`chat.socket.ts`): one server instance attached to the same HTTP server as Express
(`initChatSocket(httpServer)`), JWT-authenticated at the handshake with the same access token as
REST, one room per conversation (`conversation:{id}`) with ownership verified at join time. The
mobile client re-joins its room and invalidates/refetches the REST message list on every `connect`
event — including reconnects after a network drop — so a client that missed events while
disconnected always ends up consistent with the server's REST state rather than silently stale.

**Idempotency via a client-generated `clientMessageId`** (CLAUDE.md §38/§45): mobile generates a
UUID per send attempt; a MongoDB partial unique index on `{conversationId, clientMessageId}`
(scoped to string-valued `clientMessageId` via `partialFilterExpression`, not a plain `sparse`
index — see the note below) means a retried POST after a dropped response returns the original
message rather than creating a duplicate.

**Retry and regenerate are one operation, not two:** `chatService.regenerate()` branches on the
target message's status — a `failed` message is reset in place (same id, so a client-side retry
is invisible in history), a `complete` message instead creates a new assistant message that
references the old one via `regeneratedFromMessageId`, preserving the original in history. Mobile
exposes these as differently-labeled buttons (Retry / Regenerate) over the identical backend call.

**Not charging for failed responses (CLAUDE.md §23):** honestly scoped to what actually exists —
this codebase has no wallet module yet (§7 is still unimplemented), so there is nothing to charge
in the first place. `chat.service.ts`'s `runGeneration()` carries an explicit comment at the exact
point (immediately after reaching `status=COMPLETE`) where a future wallet debit must be inserted,
and documents that it must never move earlier in the function nor be called from the failure catch
block — the constraint is encoded structurally, ready for wallet integration, not deferred as a
TODO with no anchor.

**Mongoose pitfalls hit and fixed here** (relevant if extending this module): (1) the built-in
`String` schema type's `required: true` rejects `''`, not just `null`/`undefined` — the assistant
placeholder is created with `content: ''`, so `content` has `default: ''` but no `required`; (2) a
`sparse: true` unique index does **not** exclude documents where the field is stored as BSON
`null` (only truly-absent fields) — the `clientMessageId` unique index therefore uses
`partialFilterExpression: { clientMessageId: { $type: 'string' } }` instead, which is correct
regardless of whether the field ends up `null` or absent.

**Suggested questions are static, not AI-generated:** `suggestedQuestions.ts` holds curated
question lists per `SupportedLanguage`, split by whether a birth profile is linked — deliberately
deterministic, instant, and free rather than an AI Gateway call for what is fundamentally
placeholder UI content.

---

## 6. Birth Profile & Location Architecture

**Implemented.** `modules/birthProfiles/` owns a user's birth profiles (a user can hold several —
themselves, family, a partner for compatibility). Civil date (`dateOfBirth`) and time
(`birthTime`) are stored as plain strings (`YYYY-MM-DD`, 24-hour `HH:mm`), never a `Date` object —
a `Date` would force an implicit reinterpretation that can silently shift the calendar day; both
are interpreted against the birth location's own IANA timezone wherever they're used, never the
server's.

**Birth time confidence** (`exact` / `approximate` / `unknown`, CLAUDE.md §20) is a required,
first-class field enforced by a cross-field Zod rule: a birth time is required for `exact`/
`approximate` and forbidden for `unknown`. The wire format is 24-hour `HH:mm` only — the classic
12 AM/12 PM mixup is eliminated at the API boundary rather than handled by parsing an ambiguous
string; the mobile time picker is what's responsible for producing an unambiguous value.

**Date/time validation** (`birthProfiles/birthDateTime.ts`): a Zod regex checks shape at the
route layer; `assertValidCivilDate` then checks real calendar validity (rejects Feb 30, month 13,
...) via Luxon; `assertNotFutureDateOfBirth` is the authoritative "not in the future" check,
evaluated in the **birth location's** timezone (resolved first) rather than the server's or
client's — a birth "today" is never wrongly rejected across a UTC day boundary, and vice versa.

**Location normalization** (`modules/location/`) is a pluggable `LocationProviderAdapter`
(mirroring the AI Gateway's and auth's adapter-behind-an-interface shape), defaulting to an
`unconfiguredLocationProvider` that returns a clear `503` rather than a fake result when no real
geocoder is configured (`LOCATION_PROVIDER=none`, CLAUDE.md §51) — a birth profile can still be
created via a manual-entry fallback in that case. **Timezone is never sourced from the location
provider or trusted from client input**: it's always computed server-side from resolved
coordinates using the local IANA tz-boundary dataset (`geo-tz`, comprehensive/historical
variant), so historical timezone-boundary changes (pre-1970 births included) and manually-entered
locations both resolve correctly. Ambiguous locations (e.g. "Springfield") are handled
structurally: search returns every matching candidate and the client must have the user pick one
(a `placeId`) before a birth profile can be created from it — there's no silent best-guess.
Geocoding results are cached in Redis (30-day TTL — a fixed query/place id is effectively
static).

**Decoupling from astrology:** editing or deleting a birth profile must invalidate any stored
chart, but `birthProfiles` doesn't call into `astrology` directly — it emits `birthProfile.changed`
/`birthProfile.deleted` on an in-process event bus (`shared/eventBus.ts`), and `astrology.service`
subscribes to invalidate its own persisted data. Neither module needs to know about the other's
existence beyond `astrology` reading birth profile facts through `birthProfiles`' public service
(never its repository/model).

## 6a. Astrology Engine Architecture

**Implemented as an abstraction; no real calculation provider ships in this codebase.**
Deterministic, authoritative, **not an LLM call**.

```
modules/astrology/
├── astrology.service.ts     public API: getChart(), getTransits(), getCompatibility(), invalidateForBirthProfile()
├── astrology.controller.ts / astrology.routes.ts   /astrology/chart|transits|compatibility
├── engine/
│   ├── astrologyEngine.types.ts   the AstrologyEngine interface + AstrologyEngineInput/ComputedNatalChart
│   ├── unconfiguredEngine.ts      default when no provider is configured — throws a clear 503, never fabricates data
│   └── registry.ts                env-selected current engine + CURRENT_CALCULATION_VERSION
├── astrology.model.ts / astrology.repository.ts   persisted chart (per birthProfileId) + compatibility (per pair) snapshots
└── astrology.types.ts       birth-profile→engine-input mapping, precision-downgrade policy, doc→API-shape mapping
```

**The `AstrologyEngine` interface** is the sole seam a real engine plugs into —
`computeChart(input)` (ascendant, planet positions, houses, moon nakshatra, dasha/antardasha
tree, yogas — everything static for a fixed birth input), `computeTransits(input, atDate)`
(time-varying, not persisted), `computeCompatibility(inputA, inputB)`. `astrology.service.ts`
owns all caching/persistence/versioning; an engine implementation is a pure calculation function.

**Why unconfigured by default, not a hand-rolled implementation:** Vedic sidereal calculations
(Lahiri ayanamsa), Vimshottari dasha/antardasha math and yoga detection are a specialized,
licensable body of work most commercial astrology products buy rather than build — hand-rolling
an approximation here and presenting it as real would itself violate CLAUDE.md §51 ("do not
hardcode fake astrology results as if they were real"), and would silently be _wrong_ for a Vedic
product specifically if built on a typical (tropical/Western) open-source ephemeris library. The
honest, requested deliverable is the complete seam — interface, registry, caching, persistence,
precision policy, tests against a double — with a clearly-isolated "not configured" state
(`ASTROLOGY_ENGINE_PROVIDER=none`, every endpoint returns `503 ASTROLOGY_ENGINE_UNAVAILABLE`)
until a real provider (in-house ephemeris binding, or a licensed third-party Vedic astrology API)
is chosen and wired into `engine/registry.ts`. See Open Decision #1.

**Design decisions:**

- Computed natal charts are persisted (Mongo) keyed by `birthProfileId`, stamped with
  `calculationVersion`; `getChart` recomputes only when missing or stamped with an older version
  than `CURRENT_CALCULATION_VERSION` (bumped on an engine correction/upgrade) — results are
  stable and cheap to re-read, and a version bump doesn't silently change historical report
  content already delivered to users. Transits are cached in Redis only (12h TTL) — they're a
  moving daily snapshot, not worth permanently persisting. Compatibility results are persisted
  per unordered profile pair, same versioning rule.
- The service returns typed, structured facts only — no natural-language text. Interpretation
  in natural language is entirely the AI Gateway's job, fed these facts (CLAUDE.md §11).
- Unknown/approximate birth time (CLAUDE.md §20) is enforced centrally, not just trusted per
  engine: `astrology.types.ts`'s precision-downgrade policy forces ascendant/house `precision` to
  `unavailable` (unknown time) or `low_confidence` (approximate time) regardless of what a given
  engine implementation returns, so downstream callers (AI, reports) can never present a guess as
  fact even if a future engine forgets to flag it itself.

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

**Implemented.** Two entirely separate auth systems, not shared tokens/roles, sessions, or
signing secrets.

**End-user auth (mobile):**

- **Provider-based**, not tied to one credential type: `modules/auth/providers/` defines an
  `AuthProviderAdapter` interface (`verify(credential) → { providerId, email, name, avatarUrl }`);
  `modules/auth/auth.service.ts` depends only on that abstraction via a small provider registry
  keyed by `AuthProviderType`. **Google Sign-In is the first provider** (`google.provider.ts`,
  verifies ID tokens via `google-auth-library` against `GOOGLE_CLIENT_ID`); **phone/OTP is the
  planned second provider** and slots into the same registry with zero changes to session, user,
  or account-status logic — this is what "support future authentication providers without
  rewriting the user system" resolves to concretely.
- A verified identity is linked to a `User` via a separate `AuthIdentity` collection
  (`{ userId, provider, providerId }`, unique on `(provider, providerId)`) rather than fields on
  `User` — a user can eventually hold multiple linked providers. First sign-in creates the
  `User` + `AuthIdentity` in one Mongo transaction; a concurrent duplicate sign-in race is
  resolved by catching the resulting duplicate-key error and returning the identity that won,
  not an error (idempotent registration).
- **Tokens:** JWT access token (15 min default, `JWT_ACCESS_SECRET`) + an _opaque_ (random,
  not JWT) refresh token, only its SHA-256 hash ever persisted (`Session` collection, TTL-indexed
  on `expiresAt`). Opaque + server-side-hashed was chosen over a second JWT specifically so
  revocation is a plain DB write, not a blacklist. Refresh rotates on every use, and reuse of an
  already-rotated token — a theft/replay signal — revokes every session for that user
  (`session.service.ts`'s `rotate()`), not just the presented one.
- `authenticate` middleware verifies the access token's signature/expiry _and_ re-reads the
  user's current status from Mongo on every request (not the token's cached claim) — a
  suspension takes effect immediately, not after up to 15 minutes of remaining token lifetime.
- Mobile stores the refresh token in MMKV, encrypted with a key generated once per device and
  held in the OS Keychain/Keystore (`react-native-keychain`) — never a literal in source
  (CLAUDE.md §36). The access token lives only in memory (Zustand), re-derived via silent
  refresh on cold start.
- `apiClient.ts` (both mobile and admin) attempts exactly one silent refresh-and-retry on
  `TOKEN_EXPIRED`/`UNAUTHORIZED`; a refresh failure or `SESSION_REVOKED` tears the session down
  and returns the user to the Auth navigator (CLAUDE.md §46).

**Admin auth (admin panel):**

- Separate `AdminUser` collection, separate session collection (`AdminSession`), separate JWT
  signing secret (`ADMIN_JWT_ACCESS_SECRET`) — an end-user token can never be replayed against
  admin routes and vice versa. Password-based (argon2id hashed) — there is no public admin
  registration route; the first `super_admin` is created by `backend/scripts/seedAdmin.ts`
  (CLAUDE.md §51 — no hardcoded admin credentials in application code).
- Session tokens travel as httpOnly, `SameSite=Lax` cookies (`admin_access_token`,
  `admin_refresh_token`) scoped to `Path=/` (not just `/api/v1/admin`) — deliberately: the
  Next.js app's own `proxy.ts` needs to see the cookie on requests to its _own_ pages (`/`,
  `/login`), not only on calls to the backend API, and cookies are matched by (registrable
  domain, path), never by port, so the same cookie correctly reaches both `localhost:3000` (or
  wherever admin runs) and `localhost:4000` (the API) in local dev. `ADMIN_COOKIE_DOMAIN` scopes
  it to a shared parent domain in production. Admin's own JavaScript never reads the token
  values — only the backend and the browser's cookie jar ever see them.
- Backed by RBAC: `AdminRole` (super_admin, operations, support, finance, marketing, content,
  ai_manager, analyst — CLAUDE.md §32) maps to `AdminPermission[]` in `modules/admin/rbac.ts` —
  the single source of truth. `requirePermission(permission)` middleware guards every sensitive
  admin route server-side; the admin UI's conditional nav/action rendering (§3) reads the same
  permissions from `/admin/auth/me` but is UX only (CLAUDE.md §37 — never trust the client).
  Only `users:read`, `users:manage`, `admin_users:manage`, `audit_logs:read` exist so far
  (matching what's implemented); future modules add their own permissions to the same map.
- `proxy.ts` (Next.js's request-time hook, formerly "middleware") is an optimistic UX gate only —
  it checks cookie _presence_, not validity, to redirect fast and avoid a flash of protected
  content. The authoritative check is `(dashboard)/layout.tsx` calling `GET /admin/auth/me` on
  mount, which the backend verifies for real; a cookie that's present but no longer valid
  (expired past rotation, revoked, or an account since suspended) is caught here, not in the
  proxy, and redirects to `/login`.
- Every admin authentication event and every sensitive action should be written to `auditLogs`
  (CLAUDE.md §33) — **not yet wired up** (the `auditLogs` module is still a placeholder; this is
  the next piece to land on top of the auth foundation now in place), including actor, action,
  target, timestamp, metadata, and IP/device where legally appropriate (jurisdiction-specific —
  **TBD**, see Privacy/Risks).

Session infrastructure (`shared/session/session.schema.ts`, `session.service.ts`) is genuinely
shared between the two systems — a schema/service _factory_, not a shared collection or shared
state — since a "session" (opaque refresh token → subject, with rotation and reuse detection) is
identical infrastructure for both, instantiated once per system against its own Mongoose model
and TTL.

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

Backend uses **Vitest**; admin and mobile use Vitest/Jest respectively — settled, not TBD, as of
the auth/birth-profile/AI Gateway/astrologer/chat modules (212 backend tests, all green).

- **Unit tests:**
  pure domain logic first — pricing calculation, wallet ledger math, astrology engine functions,
  coupon validation rules, AI Gateway fallback selection logic. These require no DB/network and
  run fast.
- **Integration tests:** service + repository against a real single-node-replica-set MongoDB
  (`mongodb-memory-server`, started once per run by `tests/globalSetup.ts` — a standalone
  `mongod` rejects the multi-document transactions auth/chat use, so it must be a replica set
  even in-memory) with Redis mocked (`ioredis-mock`) — no external services required to run the
  suite. Covers modules with real query/transaction behavior: chat (conversations/messages/
  idempotency/regenerate/feedback), auth, birth profiles, astrology, and (once built) wallet,
  payments, promotions, referrals. Beyond the automated suite, chat's realtime path (Socket.IO
  delivery, not just the REST/service layer) has been additionally verified live against a real
  ephemeral MongoDB + Redis and the actual `server.ts` process — automated coverage exercises the
  service/REST layer directly and doesn't boot Socket.IO.
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
   a third-party astrology API. The `AstrologyEngine` interface, registry, caching/persistence
   and precision policy are implemented (see §6a); only the actual calculation provider is
   still open. Affects `modules/astrology/engine` internals, cost, accuracy, and latency; does
   not affect the module's public interface, so it can be deferred but should be decided before
   report/chat features are built on top of it (every astrology endpoint returns `503` until then).
2. ~~**Primary auth method**~~ **Resolved:** Google Sign-In first (implemented — see §14),
   phone/OTP planned as a second provider on the same `AuthProviderAdapter` registry once an
   SMS/OTP vendor is chosen (still open, see #3-adjacent).
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
10. ~~**Test runner choice**~~ **Resolved:** Vitest for backend and admin (fast, native ESM/TS,
    minimal config); Jest for mobile (the React Native ecosystem's default, required by
    `@react-native/jest-preset` and `@testing-library/react-native`) — the two apps' test
    tooling doesn't need to match since they never share test code.

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

- Astrology module's abstraction/caching/persistence layer is fully implemented and tested
  against a test-double engine; it depends on Decision #1 (a real calculation provider) before
  it can return genuine chart data — see docs/ENVIRONMENT.md's "Astrology engine".
- Location search/geocoding (birth profile creation) works with manual entry by default;
  real search/disambiguation needs `LOCATION_PROVIDER=google` + a Google Geocoding API key — see
  docs/ENVIRONMENT.md's "Location provider".
- Auth module's Google provider is fully implemented but needs a real Google Cloud OAuth client
  (Web + iOS + Android client IDs) before it can be exercised beyond mocked tests — see
  docs/ENVIRONMENT.md's "Google Sign-In setup". The phone/OTP provider additionally needs an
  SMS/OTP vendor chosen.
- Notifications module depends on Decision #3.
- Payments module depends on Razorpay account/credentials (test mode acceptable for development,
  per "do not use fake production secrets" — real Razorpay _test_ keys are required, not fabricated
  ones).
- AI Gateway is fully implemented (real OpenAI/Anthropic/Gemini adapters, router, retry/
  fallback/timeout, usage tracking) and tested against fake `ProviderAdapter` doubles — CLAUDE.md
  §51 forbids faking provider responses in production code, so it still needs at least one real
  provider API key (test/dev tier) configured before any live business feature built on top of it
  can produce genuine output. No caller exists yet (chat/reports/horoscope are all unbuilt); no
  admin route exists yet to edit alias routing config, though the service layer for one does.
- AI astrologer intelligence layer (§5a) is fully implemented and tested against a fake
  `ProviderAdapter`, including the full CLAUDE.md test-case list (love/marriage/career/money/
  family/general astrology/daily horoscope/compatibility/unclear/multilingual/unsafe/medical/
  death-related/crisis questions). Like the AI Gateway it depends on, it produces genuine
  responses only once a real provider key is configured; the crisis-language safety path works
  regardless, since it never calls the AI Gateway at all. No admin route exists yet to edit the
  active persona, though the service layer for one does.

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
