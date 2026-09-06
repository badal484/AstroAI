# Astro AI — Mobile UX Specification

## 1. Overview & Experience Principles
The mobile app is the seeker's primary touchpoint with **Acharya Vashishta**. It must convey the calm reverence, precision, and personal attention of a real Vedic consultation rather than a generic SaaS or chatbot.

### Core Experience Pillars:
1. **Sanctuary over Dashboard**: The app opens into a serene, personalized consultation environment.
2. **Intentional Guidance**: The seeker is presented with clear next steps and meaningful reflections, not clutter.
3. **Astrological Integrity**: Real Jyotish calculations (Dasha, Transit, Dignities) are translated into clear, human-understandable guidance without dumbing down the sacred science.
4. **Transparent & Dignified Economics**: Balances, rates, and pack options are always clear and upfront.

---

## 2. Screen-by-Screen Specifications

### 2.1 Onboarding & Authentication
* **Goal**: Establish trust and sacred atmosphere while collecting accurate birth parameters (Date, Time, Place).
* **Layout**:
  - Deep Midnight background (`#0B0F19`) with a subtle antique gold geometry accent.
  - Heading: *"Your Personal Vedic Astrologer"* with Acharya Vashishta introduction.
  - Restrained birth data entry: Single focused form with autocomplete location lookup, timezone auto-detection, and time-accuracy confirmation.
  - No loud animations, confetti, or neon cosmic art.

### 2.2 Home Screen (`HomeScreen.tsx`)
* **Goal**: Immediate access to personal guidance, chart overview, and ongoing conversations.
* **Layout Hierarchy**:
  1. **Header**: Seeker name, current Moon Sign/Nakshatra badge, and dynamic Credit balance.
  2. **Acharya Hero Ingress**:
     - Warm editorial greeting based on time of day and active Dasha (e.g. *"Shubh Sandhya, Badal. What has been on your mind?"*).
     - Single primary action: *"Ask Acharya"* text input / voice trigger.
     - Quick topic inquiries: `[ Career Transition ]`, `[ Marriage Timing ]`, `[ Financial Health ]`, `[ Mental Clarity ]`.
  3. **Celestial Snapshot**:
     - Concise transit highlight affecting the user's Moon/Lagna (e.g. *"Jupiter transiting your 9th House — a supportive period for higher learning and dharmic initiatives."*).
  4. **Ongoing Consultation Resume Card**:
     - Quick recap of the last question asked, time elapsed, and one-tap resume.
  5. **Vedic Explorations**:
     - Kundli Explorer, Relationship Compatibility, Voice Consultation, and Detailed Reports.

### 2.3 Consultation & Chat (`ChatScreen.tsx`, `MessageBubble.tsx`)
* **Goal**: High-fidelity personal dialogue with Acharya Vashishta.
* **Layout Hierarchy**:
  1. **Top Bar**:
     - Acharya Vashishta avatar with serene indicator, title (*"Vedic Guide"*), and active billing rate.
  2. **Message Stream**:
     - **Acharya Messages**: Left-aligned, warm surface container (`#121827`), elegant typography with paragraph spacing. Astrological highlights (e.g., *7th House Venus*, *Saturn Sade Sati*) rendered in antique gold text.
     - **User Messages**: Right-aligned, elevated surface (`#1B2236`), crisp ivory text.
     - **Contextual Processing Indicator**: Distinct state showing genuine calculation: *"Acharya is reading your chart…"* with subtle house reference when computing factors.
  3. **Vedic Follow-up Chips**:
     - Contextual exploration suggestions generated from the reading (e.g., `[ Remedies for Mars ]`, `[ Next Dasha Shift ]`).
  4. **Input Console**:
     - Clean text area with audio record button, mic trigger, and remaining balance display.

### 2.4 Kundli Explorer (`KundliExplorerScreen.tsx`)
* **Goal**: Interactive, authoritative Vedic chart exploration.
* **Layout Hierarchy**:
  1. **Profile Summary**: Date of birth, exact time, latitude/longitude, Ayanamsha (Lahiri), Lagna & Rashi.
  2. **Chart Canvas**:
     - Crisp North Indian diamond chart layout with high contrast lines (`#D4A347` / `rgba(255,255,255,0.15)`).
     - Clear house numbers (1 to 12) and planetary glyphs/abbreviations with Retrograde (`[R]`), Exalted (`↑`), and Debilitated (`↓`) tags.
  3. **Interactive Inspector**:
     - Tapping any house highlights the house and lists: Resident planets, Aspecting planets, Lord placement, and Significator domains (Karakas).
  4. **Planetary Placement Table**:
     - Tabular breakdown of Planet, Sign, Degree, Nakshatra & Pada, Dignity, and House.
  5. **Active Dasha Timeline**:
     - Mahadasha -> Antardasha -> Pratyantardasha hierarchy with start and end dates.

### 2.5 Voice Consultation (`VoiceCallScreen.tsx`)
* **Goal**: Serene, real-time verbal consultation with Acharya Vashishta.
* **Layout Hierarchy**:
  1. **Header**: Session duration, live credit deduction ticker, and end call button.
  2. **Central Astrologer State**:
     - Elegant resonant circle with subtle state transitions:
       - *Listening to you...* (Gentle slow breath pulse)
       - *Reflecting on your chart...* (Focused golden ring)
       - *Acharya speaking...* (Harmonic subtle wave)
  3. **Live Transcript / Guidance Caption**:
     - Clear subtitle text of Acharya's current words for comprehension in noisy environments.
  4. **Controls**:
     - Mute/Unmute microphone, Speaker toggle, and End Consultation button.

### 2.6 Compatibility & Kundli Milan (`CompatibilityScreen.tsx`)
* **Goal**: Multi-dimensional Vedic relationship analysis without blunt percentage gimmicks.
* **Layout Hierarchy**:
  1. **Partner Profiles**: Seeker & Partner birth charts and Moon signs.
  2. **Ashtakoota & Dosha Summary**:
     - Total score (e.g., *28 / 36 Gunas*) with qualitative breakdown:
       - **Manasik (Mental/Emotional)**: Maitri & Gana.
       - **Dharmic (Spiritual/Destiny)**: Nadi & Bhakoot.
       - **Physical / Health**: Yoni & Tara.
     - **Manglik / Kuja Dosha Analysis**: Cancellation factors and mutual mitigation rules.
  3. **Relationship Guidance**:
     - Strengths of the connection, areas requiring mutual patience, and astrological timing insights.

### 2.7 Wallet & Credit Packs (`WalletScreen.tsx`, `PaymentCheckoutScreen.tsx`)
* **Goal**: Absolute clarity in credit balance, usage rates, and transaction history.
* **Layout Hierarchy**:
  1. **Balance Card**: Total available credits, approximate voice minutes / chat questions value.
  2. **Live Rate Card**:
     - Dynamic rates from backend (Chat per query, Voice per minute, Reports per document).
  3. **Credit Packs**:
     - Tiered options with base credits, bonus credits, and INR price clearly broken down.
  4. **Activity Ledger**:
     - Itemized list with timestamp, transaction type, credit amount, and reference ID.

---

## 3. Responsive & Accessibility Standards
- Minimum tap target: 44x44 points.
- High contrast: Text meets WCAG AA (minimum 4.5:1 for body, 7:1 for headers).
- Full dark theme fidelity: Seamless rendering in low-light environments without eye strain.
- Offline graceful degradation: Cached chart data and historical readings remain fully readable offline.
