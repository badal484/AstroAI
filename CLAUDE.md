# AI ASTROLOGY PLATFORM — MASTER INSTRUCTIONS

## 1. Project Objective

Build a production-grade AI astrology platform that provides personalized Vedic astrology
experiences through conversational AI, astrology calculations, text chat, voice interaction,
reports, compatibility analysis, personalized notifications, payments, wallet/credits,
promotions and a powerful administration system.

The application must prioritize:

- Reliability
- Security
- Privacy
- Premium UX
- Correct astrology calculations
- Natural AI conversations
- Multilingual support
- Flexible business configuration
- Admin control
- Observability
- Maintainability
- Scalability

Do not build a simple LLM wrapper. The system must have a dedicated astrology calculation
layer and a provider-independent AI layer.

## 2. Technology Requirements — Mobile

Use: React Native CLI, TypeScript, React Navigation, TanStack Query, Zustand,
React Hook Form, Zod, React Native Reanimated, MMKV, Socket.IO Client, NativeWind or a
well-structured StyleSheet architecture.

Do not migrate to Expo unless explicitly instructed.

## 3. Backend

Use: Node.js, Express.js, TypeScript, MongoDB Atlas, Mongoose, Redis, BullMQ, Socket.IO,
Zod, JWT/authentication system, Razorpay.

Use a modular monolith. Do not introduce microservices unless explicitly requested.

## 4. Admin Panel

Use: Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod,
Recharts.

The admin panel must be a full operational control center. Admin capabilities must include:
user management, user search/filtering, user suspension, user banning, wallet management,
manual credit/debit, payment management, refunds, pricing, AI provider configuration,
AI model routing, AI personas, prompt configuration, language configuration, astrology
configuration, reports, compatibility, voice, notifications, campaigns, promotions, coupons,
referrals, content, feature flags, analytics, support, audit logs, system configuration.

Every sensitive admin operation must create an audit log.

## 5. TypeScript

Use strict TypeScript. Avoid: `any`, unnecessary type assertions, duplicated types,
unvalidated external data. All external input must be validated.

Prefer: interfaces/types, discriminated unions, enums/constants where appropriate,
reusable domain types.

## 6. Architecture

Mobile → API → Controller → Service → Domain logic → Repository/infrastructure.

Controllers must remain thin. Do not put business logic inside React screens, Express
route files, or controllers. Business logic belongs inside services/domain modules.

## 7. Modules

Backend modules should include: auth, users, profiles, birthProfiles, astrology, ai, chat,
voice, wallet, pricing, payments, reports, compatibility, horoscope, notifications,
promotions, referrals, analytics, support, admin, featureFlags, auditLogs.

Keep modules isolated and reusable.

## 8. AI Gateway

THIS IS A HARD REQUIREMENT. Never call OpenAI, Gemini, Claude or another AI provider
directly from controllers or business modules. All AI calls must go through an internal
AI Gateway.

Application code should use abstractions such as: `generateText()`, `streamText()`,
`generateStructured()`, `classifyIntent()`, `generateEmbedding()` where required.
Provider-specific implementations must live behind adapters.

Architecture: AI Gateway → Model Router → Provider Adapter → Provider SDK.

Providers may include OpenAI, Gemini, Anthropic, future providers. The application must
remain provider-independent.

## 9. Model Aliases

Never hardcode provider model IDs throughout the application. Use logical model aliases:
`fast-chat`, `smart-chat`, `reasoning`, `voice-chat`, `report-generation`, `summarization`,
`classification`.

The admin/model configuration maps these aliases to actual providers/models. Changing a
model must not require rewriting business logic.

## 10. AI Fallback

Implement provider fallback. If the selected provider fails because of timeout, temporary
outage, rate limit, or provider error, the model router should attempt an eligible fallback
provider when configured. Do not expose provider-specific errors to users.

Record: request ID, provider, model, latency, success/failure, fallback, token usage where
available, estimated cost where available, error category.

## 11. Astrology Engine

NEVER ask the LLM to calculate astrology facts. The astrology calculation engine/API is
authoritative for: planetary positions, houses, ascendant, nakshatra, dasha, antardasha,
yogas, transits, compatibility calculations, other deterministic astrology calculations.

The AI interprets verified astrology data. The AI must never invent planetary positions,
houses, dasha, scores, dates, or astrological calculations.

## 12. AI Astrologer Behavior

The AI should feel like an experienced, warm, conversational astrologer: warm, calm,
empathetic, confident but not absolute, conversational, culturally natural, simple language,
emotionally aware, non-judgmental.

Do not make the AI sound robotic. Do not repeatedly say "According to your birth chart...".
Use natural conversation. The AI should acknowledge the user's emotional context where
appropriate.

## 13. AI Must Not Claim to Be Human

The AI may have a defined astrologer persona. It must not falsely claim that it is a human
astrologer, that a human personally performed the response, or that it has real-world
experiences it does not have. It can maintain a consistent persona.

## 14. Astrology Response Structure

When useful, responses should naturally contain: direct answer, relevant astrological
interpretation, reasoning/context, time period or trend where supported, practical
perspective, appropriate uncertainty.

Do not force this structure into every response. Responses should feel conversational.

## 15. No Guaranteed Predictions

Avoid absolute claims. Never state with certainty: exact death date, guaranteed marriage,
guaranteed divorce, guaranteed pregnancy, guaranteed disease, guaranteed financial success,
guaranteed job loss, guaranteed accident, guaranteed disaster.

Use probabilistic and interpretive language.

## 16. Health

Astrology must never be presented as a medical diagnosis. If a user asks whether they have
a disease based on their chart, explain that astrology cannot diagnose medical conditions
and encourage appropriate professional medical care.

## 17. Crisis / Self-Harm

If a user expresses imminent self-harm or suicide intent: do not continue with predictive
astrology. Switch to a supportive safety response. Encourage immediate help from emergency
services, crisis resources, trusted people and qualified professionals as appropriate to the
user's location. Do not predict death.

## 18. Multilingual System

Initial supported languages: English, Hindi, Hinglish. Architecture must support adding
more languages without rewriting business logic.

Store: preferred language, detected language, conversation language. The AI should respond
naturally in the selected language. Do not mechanically translate an English response when
high-quality direct generation is possible. Preserve astrology terminology accurately.

## 19. Language Behavior

If the user writes in Hindi, answer in Hindi. If the user writes in English, answer in
English. If the user writes Hinglish, natural Hinglish is allowed. If the user explicitly
requests another language, follow the request. The user can change language at any time.

## 20. Birth Profile

Support exact birth time, approximate birth time, unknown birth time. Never present
uncertain birth-time calculations as exact.

Validate: impossible dates, future dates, invalid times, timezone ambiguity, 12 AM / 12 PM
confusion, location ambiguity.

## 21. Location

Normalize birth locations. Store: canonical location name, latitude, longitude, timezone,
country.

Handle: misspellings, duplicate city names, villages, historical timezone differences,
timezone changes. Never silently assume a location when ambiguity could materially affect
calculations.

## 22. User Memory

Use layered memory: recent conversation, conversation summary, important user preferences,
relevant long-term context. Do not send unlimited historical conversation to the model.
Users must be able to manage/delete applicable memory.

## 23. Chat

Chat must support: streaming, message persistence, retry, regeneration, copy, share,
feedback, voice input, text-to-speech where enabled, conversation history.

If AI generation fails, do not charge the user for an unsuccessful response.

## 24. Wallet

Wallet must use an immutable transaction ledger. Never rely solely on a mutable balance.

Every transaction must contain: transaction ID, user ID, amount, currency, transaction
type, source, reference ID, balance before, balance after, status, metadata, timestamp.

Wallet changes must be atomic. Prevent double spending. Use database transactions/appropriate
concurrency controls.

## 25. Pricing

PRICING MUST NEVER BE HARDCODED. All prices must be configurable through the admin panel.

Support configurable: chat pricing, voice pricing, report pricing, credit packs,
subscriptions, discounts, promotional pricing, billing units, rounding rules, minimum
charge, free credits, regional pricing if enabled, scheduled pricing.

Pricing configuration must be versioned where appropriate. Existing transactions must
retain the price/configuration used at transaction time. Changing current pricing must not
rewrite historical transactions.

## 26. Voice Billing

Voice billing must support configurable: per-second, per-30-second, per-minute.

Support: minimum charge, free initial duration, rounding rules, maximum session duration,
insufficient balance handling.

If the service fails, billing must stop appropriately. Never overcharge due to duplicate
events.

## 27. Payments

Payment frontend state is NOT authoritative. Razorpay webhook/server verification is
authoritative.

Handle: duplicate webhooks, delayed webhooks, failed payments, cancelled payments,
successful payment with app crash, duplicate payment attempts, refund, partial refund where
supported, webhook retries, signature validation, reconciliation.

All payment operations must be idempotent.

## 28. Reports

Reports should be asynchronous.

Flow: payment → verified payment → report job → astrology calculation → AI generation →
validation → PDF generation → storage → notification.

Failed jobs must retry. Repeated failures must alert administrators.

## 29. Notifications

Build an event-driven notification system. Support: push notifications, email where
configured, SMS/other channels where configured.

Events may include: registration, birth profile completion, first chat, low wallet balance,
report ready, horoscope ready, inactivity, purchase, birthday, promotions, referrals.

Respect: user preferences, quiet hours, timezone, frequency caps, language, opt-out,
campaign deduplication.

## 30. Personalization

Notifications should be personalized using relevant behavioral context. Examples: user
completed Kundli but hasn't started chat, user frequently asks career questions, user
purchased a report, user has low balance, user has been inactive.

Do not expose sensitive internal analytics in notification text. Avoid manipulative or
fear-based astrology marketing.

## 31. Promotions

Support: promo codes, coupons, welcome offers, first purchase, referral rewards, scheduled
campaigns, user segmentation, usage limits, per-user limits, minimum purchase, expiry,
activation/deactivation.

Prevent: coupon abuse, referral loops, duplicate rewards, self-referrals, multiple-account
abuse where detectable.

## 32. Admin RBAC

Do not use one universal admin role. Support configurable roles such as: super admin,
operations, support, finance, marketing, content, AI manager, analyst.

Sensitive permissions must be restricted. Examples: Finance may manage refunds. Marketing
may manage campaigns. AI manager may manage model configurations. Only authorized roles
may view sensitive user data.

## 33. Audit Logging

Log sensitive actions: admin login, user suspension, user deletion, wallet adjustment,
refund, pricing change, model change, prompt change, feature flag change, campaign launch,
permission change.

Audit logs should contain: actor, action, target, timestamp, relevant metadata, IP/device
information where legally appropriate.

## 34. Admin AI Controls

Admin must be able to configure: AI providers, model aliases, fallback order, model
availability, persona, system prompts, response style, supported languages, token limits,
usage limits, cost controls, feature-specific model selection.

Do not expose provider secrets to normal administrators.

## 35. Feature Flags

Major features must support feature flags. Examples: AI chat, voice, reports,
compatibility, referrals, subscriptions, human astrologers, new languages.

Feature flags should allow controlled rollout.

## 36. Security

Never store API keys in the mobile application. Secrets must remain server-side.

Implement: authentication, authorization, rate limiting, request validation, secure
headers, CORS, abuse protection, encrypted secrets, secure storage, logging without
sensitive data, access control, audit trails.

Do not log: passwords, authentication tokens, payment secrets, unnecessary personal data,
full sensitive conversations unnecessarily.

## 37. API Design

Use versioned APIs: `/api/v1/...`. Use consistent response formats. Use proper HTTP status
codes. Validate request bodies, query parameters and route parameters.

Never trust client-provided: wallet balances, prices, payment status, permissions, user
IDs, transaction results.

## 38. Idempotency

Use idempotency wherever duplicate requests could cause financial or state problems.
Especially: payments, wallet credits, wallet deductions, refunds, reports, notification
sending, referral rewards.

## 39. Error Handling

Never expose stack traces to users. Return safe user-facing errors. Internally log enough
information for debugging.

Use: structured errors, error codes, correlation/request IDs, centralized Express error
middleware.

## 40. External Services

All external service calls must have: timeout, retry where appropriate, exponential
backoff where appropriate, circuit/failure handling where appropriate, fallback where
configured, structured logging.

Never retry non-idempotent financial operations blindly.

## 41. Redis

Use Redis for: caching, rate limiting, temporary session state where appropriate,
distributed locks where required, queues/BullMQ support.

Do not use Redis as the permanent source of truth for financial data.

## 42. Background Jobs

BullMQ jobs must be: retryable, observable, idempotent, safely recoverable.

Examples: report generation, notifications, daily horoscope generation, AI summaries,
marketing campaigns, email, cleanup.

## 43. UX Requirements

The application must feel premium. Prioritize: fast startup, skeleton loading, optimistic
UI where safe, streaming responses, meaningful empty states, meaningful error states,
graceful offline behavior, accessible touch targets, smooth animations, clear navigation,
minimal unnecessary steps.

Never create a dead-end screen. Every important failure must give the user a clear next
action.

## 44. Money UX

Before any paid operation, clearly show: what is being purchased, price, credits/minutes,
applicable discount, remaining balance where relevant.

Never surprise users with charges. For voice, clearly communicate billing rules.

## 45. Offline / Network Edge Cases

Handle: no internet, intermittent connection, request timeout, duplicate request, app
backgrounding, app termination, network recovery.

Do not create duplicate: messages, payments, wallet transactions, reports.

## 46. Mobile App State

Handle: cold start, background/foreground, authentication expiration, token refresh, deep
links, push notification navigation, interrupted payment, interrupted voice, interrupted
streaming response.

## 47. Database Rules

Use indexes for frequently queried fields. Avoid unbounded arrays in MongoDB documents.
Paginate large datasets. Never load all messages/users/transactions into memory. Use
aggregation pipelines appropriately for analytics.

## 48. Admin UX

Admin must support: search, filtering, sorting, pagination, bulk actions where safe,
confirmation for destructive actions, audit visibility, export where appropriate, clear
success/error feedback.

Destructive actions require confirmation.

## 49. Analytics

Track product metrics including: registrations, activation, first chat, first purchase,
revenue, retention, churn, wallet usage, voice usage, report purchases, notification
conversion, campaign conversion, AI cost, AI latency, provider failures.

Avoid collecting unnecessary personal data.

## 50. Testing

Every module must have tests appropriate to its complexity. Test especially:
authentication, wallet, pricing, payments, refunds, AI fallback, voice billing, coupons,
referrals, notifications, permissions, report generation, edge cases.

Financial logic requires strong automated tests.

## 51. No Fake Implementations

Do not create fake successful payment responses. Do not fake AI provider responses in
production code. Do not silently bypass authentication. Do not use hardcoded wallet
balances. Do not use hardcoded admin credentials.

If an external integration is unavailable, create a clearly isolated adapter/interface and
document the required configuration.

## 52. Code Quality

Before considering a task complete: run TypeScript checks; run linting; run relevant
tests; check imports; check error handling; check loading states; check empty states;
check authorization; check mobile responsiveness where applicable; check accessibility;
check duplicate request behavior; check failure/retry behavior.

Do not declare a feature complete merely because the happy path works.

## 53. Implementation Discipline

Work in small phases. Before implementing a feature: understand existing architecture,
inspect related files, identify dependencies, plan the change, implement, test, review
edge cases, update documentation.

Do not rewrite unrelated code. Do not introduce unnecessary dependencies. Do not change
the architecture without explicit justification.

## 54. UI Design Principles

The mobile application should feel premium, modern, calm, trustworthy, magical without
becoming childish, Indian in cultural context without excessive visual clutter.

Use consistent typography, spacing, icons, animations, components, colors, cards, buttons,
loading states. Create reusable components rather than duplicating screen UI.

## 55. Accessibility

Support: readable typography, sufficient contrast, screen reader labels where appropriate,
accessible buttons, appropriate touch target sizes, reduced motion where appropriate.

## 56. Privacy

Birth date, birth time, birth location and conversations can be sensitive personal
information. Minimize collection. Store only what is necessary. Provide appropriate
deletion/account controls. Do not expose user data to unauthorized admins.

## 57. Final Rule

The goal is not to make the code merely "work". The goal is to build a reliable,
maintainable, scalable production product.

Always think about:

- What happens if this operation fails halfway?
- What happens if the user taps twice?
- What happens if the network disappears?
- What happens if the provider is down?
- What happens if the webhook arrives twice?
- What happens if the app is killed?
- What happens if the user has insufficient balance?
- What happens if an administrator misconfigures something?
- What happens if the user enters invalid data?
- What happens if an AI response is unsafe or incorrect?

Handle these cases explicitly. Never assume the happy path.
