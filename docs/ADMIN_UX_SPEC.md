# Astro AI — Admin Console UX Specification

## 1. Executive Operations Architecture
The Admin Operations Console is designed for business operators, astrologer intelligence supervisors, and platform administrators. It prioritizes information density, operational clarity, real-time telemetry, and auditability.

### Core Experience Pillars:
1. **Command Center Density**: High signal-to-noise ratio. No fluffy empty cards or decorative filler.
2. **Domain-Separated Governance**: Clear division between Financial Operations, AI Telemetry, Vedic Calculation Rules, and Growth/Promotions.
3. **Actionable Telemetry**: Real-time service health, provider failover rates, token economics, and transaction ledgers.
4. **Predictable Controls**: Structured forms, modal workflows with confirmation safeguards, and comprehensive audit logging.

---

## 2. Navigation & Shell Architecture

### 2.1 Refined Sidebar
* **Background**: Deep Navy Canvas (`#0B0F19`) with a 1px right border (`rgba(255,255,255,0.08)`).
* **Brand Header**: *"ASTRO AI"* overline with *"Operations Command Center"* badge.
* **Navigation Sections & Items**:
  1. **OPERATIONS**:
     - Dashboard (`/`)
     - Users (`/users`)
     - Wallet & Ledger (`/wallets`)
     - Payments (`/payments`)
     - Refunds (`/refunds`)
     - Support (`/support`)
  2. **GROWTH & PRICING**:
     - Pricing & Packs (`/pricing`)
     - Promotions (`/promotions`)
     - Notifications (`/notifications`)
     - Referral Engine (`/referrals`)
  3. **ASTROLOGY ENGINE**:
     - AI Operations & Routing (`/ai`)
     - Vedic Engine Rules (`/astrology`)
     - Reports Catalog (`/reports`)
     - Compatibility Engine (`/compatibility`)
     - Voice Sessions (`/voice`)
  4. **PLATFORM GOVERNANCE**:
     - Content & CMS (`/content`)
     - Feature Flags (`/feature-flags`)
     - Analytics (`/analytics`)
     - Audit Trail (`/audit-logs`)
     - System Settings (`/settings`)
* **Styling**: Clean SVG icons with uniform 18x18 bounding boxes, muted ivory active state with 3px antique gold left indicator border. No neon purple bubbles or raw emojis.

---

## 3. Key Page Specifications

### 3.1 Executive Dashboard (`/`)
* **Top Metric Ribbon**:
  - Net Revenue (24h / 7d / 30d with % delta)
  - Active Users & Daily Active Seekers
  - Ongoing Consultations (Chat turns + Live Voice minutes)
  - AI Gateway Unit Cost (₹ per query / Voice ₹ per minute)
* **Real-Time Service Health Board**:
  - AI LLM Providers (OpenAI, Anthropic, Gemini, Groq) with p95 latency and fallback state
  - Astrologer Calculation Engine status (Swiss Ephemeris / Ephemeris cache hit rate)
  - Razorpay Payment Gateway & Webhook delivery queue
* **Recent Activity Feed**:
  - Live stream of consultations, credit pack purchases, and critical alerts.

### 3.2 Pricing & Billing Rates (`/pricing`)
* **Active Configuration Overview**:
  - Real-time rates for Chat query, Voice consultation per minute, Signup gift credits, and Free daily allowance.
* **Credit Pack Catalog**:
  - Interactive grid displaying SKU, Pack Name, Base Credits, Bonus Credits, Total Credits, Price in INR, and Active/Archived status.
* **Pricing Version History**:
  - Filterable table showing Version Number, Effective From/To dates, Author, Change summary, and Rollback actions.
* **Version Creation Workflow**:
  - Modal with grouped input fields for Service Rates, Pack Definitions, and Justification Notes with live preview of unit economics.

### 3.3 AI Operations & Model Routing (`/ai`)
* **Gateway Orchestration**:
  - Primary Provider selector, Fallback Chain configuration, and Timeout thresholds.
* **Task-Specific Routing Matrix**:
  - Fast Dialogue -> Low-latency model (e.g., GPT-4o-mini / Claude 3.5 Haiku)
  - Deep Vedic Reasoning -> High-capacity model (e.g., GPT-4o / Claude 3.5 Sonnet)
  - Complex Reports -> Deep reasoning model
* **Telemetry & Economics**:
  - Hourly token consumption, average response latency graph, and validation safety deflection rate.

### 3.4 Vedic Astrology Engine (`/astrology`)
* **Ephemeris & Ayanamsha Settings**:
  - Active Ayanamsha (Lahiri / True Chitra Paksha default, Raman, KP, Tropical).
  - House System (Placidus / Equal House / Shripati / Whole Sign).
* **Dasha & Calculation Parameters**:
  - Vimshottari year length standard (365.25 days solar vs 360 days savana).
  - Transit calculation frequency and orb tolerances.
* **Engine Test Workbench**:
  - Real-time Kundli tester allowing administrators to input birth coordinates and verify planetary positions, dignities, and Shadbala scores.

---

## 4. UI Components & Layout Rules
* **Data Tables**:
  - Sticky header row with sorting arrows and column filters.
  - Alternating subtle row contrast (`#121827` and `#161D2F`).
  - Row action menus (View, Edit, Archive, Audit).
* **Forms & Modals**:
  - Two-column grid for complex operational inputs.
  - Inline validation with descriptive error hints.
  - Sticky modal footer with clear *"Save Changes"* (Primary Gold) and *"Cancel"* (Secondary).
* **Badges & Status Tags**:
  - `Active` (Emerald green `#10B981` on 10% opacity pill).
  - `Pending` (Amber `#F59E0B` on 10% opacity pill).
  - `Failed` / `Archived` (Muted Rose `#EF4444` on 10% opacity pill).
