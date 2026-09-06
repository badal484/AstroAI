# Astro AI — Central Design System

## 1. Design Philosophy: Modern Indian Spiritual Technology
Astro AI merges contemporary digital product excellence with the quiet dignity, warmth, and profound wisdom of classical Vedic Jyotish.

The visual identity is defined by:
1. **Calm Restraint**: Deep midnight backgrounds, warm ivory surfaces, and restrained antique gold accents. No loud neon purple glows.
2. **Intentional Hierarchy**: Every visual element serves a cognitive purpose (comprehension, decision-making, navigation, or feedback).
3. **Editorial Typography**: Generous line heights, crisp character spacing, and authentic multilingual typographic balance across English, Hindi (Devanagari), and Hinglish.
4. **Structured Information Architecture**: Data and astrology charts are structured cleanly without trapping every single element in floating cards.

---

## 2. Color Palette & Semantic Tokens

### Core Neutral Palette
* **Deep Midnight (Background)**: `#0B0F19` (App canvas background)
* **Surface Default (Level 1)**: `#121827` (Main containers, cards, sidebar)
* **Surface Elevated (Level 2)**: `#1B2236` (Modals, popovers, active controls)
* **Surface Input**: `#161D2F` (Form inputs, search bars)
* **Border Subtle**: `rgba(255, 255, 255, 0.08)` (Dividers, light container outlines)
* **Border Default**: `rgba(255, 255, 255, 0.14)` (Active card borders, table lines)
* **Border Focus**: `#E2B857` (Keyboard focus ring, active inputs)

### Brand & Celestial Accents
* **Antique Gold (Primary Accent)**: `#D4A347` (Vedic markers, primary buttons, key insights)
* **Warm Gold Light**: `#E9C16C` (Hover/highlight states)
* **Gold Muted / Tint**: `rgba(212, 163, 71, 0.12)` (Pill badges, selected tabs)
* **Warm Saffron (Spiritual Indicator)**: `#D96B27` (Temple, ceremonial, and urgent dharmic tags)
* **Muted Celestial Indigo**: `#5C6F9C` (Secondary indicators, astronomical markers)

### Semantic Feedback Tokens
* **Success**: `#10B981` (Verified placements, favorable transit, successful payments)
* **Warning**: `#F59E0B` (Approaching transit shift, low wallet balance)
* **Danger / Error**: `#EF4444` (Validation errors, critical safety deflections)
* **Info**: `#38BDF8` (Informational tooltips, astrological definitions)

### Text & Contrast Hierarchy (WCAG AAA/AA Compliant)
* **Text Primary (Warm Ivory)**: `#F8FAFC` (Headings, primary body content — Contrast > 14:1 against background)
* **Text Secondary**: `#94A3B8` (Descriptions, subtitles, secondary metadata — Contrast > 7:1)
* **Text Muted**: `#64748B` (Timestamps, table headers, footnotes — Contrast > 4.5:1)
* **Text Accent (Gold)**: `#E2B857` (Highlighted astrological terms, dasha labels)

---

## 3. Typography Scale & Hierarchy

The typography pairs a high-readability sans-serif for UI and system controls with an elegant serif reserved exclusively for major astrology readings and headline moments.

| Token | Size | Line Height | Weight | Usage |
| :--- | :---: | :---: | :---: | :--- |
| **Display** | 28px | 34px | 700 / Bold | Major screen titles, Kundli hero headings |
| **Heading 1 (H1)** | 22px | 28px | 600 / SemiBold | Section headings, consultation intros |
| **Heading 2 (H2)** | 18px | 24px | 600 / SemiBold | Card titles, modal headers |
| **Heading 3 (H3)** | 16px | 22px | 600 / SemiBold | Sub-section titles, table column categories |
| **Body Large** | 16px | 24px | 400 / Regular | Astrologer reading paragraphs, opening remarks |
| **Body** | 14px | 20px | 400 / Regular | General UI copy, chat dialogue, list items |
| **Body Secondary** | 13px | 18px | 400 / Regular | Supporting descriptions, form helper text |
| **Caption** | 12px | 16px | 400 / Regular | Timestamps, status indicators, chart footnotes |
| **Overline / Label**| 11px | 14px | 700 / Bold | Uppercase category pills, table header labels |

---

## 4. Spacing Scale

Strict 4px/8px modular spacing scale:

```typescript
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
};
```

---

## 5. Border Radii Scale

Restrained, purposeful geometry instead of pill-shaped everything:

* **None (`radius.none`)**: `0px`
* **Small (`radius.sm`)**: `4px` (Small chips, badge tags, table row highlights)
* **Medium (`radius.md`)**: `8px` (Inputs, standard buttons, dropdown menus)
* **Large (`radius.lg`)**: `12px` (Cards, dialog containers, bottom sheets)
* **Extra Large (`radius.xl`)**: `16px` (Main hero surfaces, chart canvas container)
* **Full (`radius.full`)**: `9999px` (User avatar circles, status indicator dots ONLY)

---

## 6. Elevation & Shadows

Avoid arbitrary floating shadows. Use surface contrast and fine borders as the primary elevation mechanism:

```css
/* Level 0: Canvas */
background: #0B0F19;

/* Level 1: Surface with subtle 1px border */
background: #121827;
border: 1px solid rgba(255, 255, 255, 0.08);

/* Level 2: Elevated Dialog / Sheet with soft ambient shadow */
background: #1B2236;
border: 1px solid rgba(255, 255, 255, 0.14);
box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
```

---

## 7. Component Rules

### Buttons
* **Primary**: Antique Gold background (`#D4A347`), dark slate text (`#0B0F19`), 8px radius, font-weight 600.
* **Secondary**: Surface Elevated background (`#1B2236`), white text, 1px subtle border.
* **Ghost / Text**: Transparent background, Warm Ivory text, gentle hover background.
* **Destructive**: Muted crimson background (`#7F1D1D`), light pink text (`#FECACA`).

### Inputs & Controls
* Height: 44px (touch-friendly).
* Background: `#161D2F` with 1px border `rgba(255, 255, 255, 0.12)`.
* Focus: 1.5px border in Antique Gold (`#E2B857`), zero neon glow.

### Astrological Chips
* Background: `rgba(212, 163, 71, 0.08)`.
* Border: `1px solid rgba(212, 163, 71, 0.25)`.
* Text: `#E9C16C`, 12px, font-weight 500.
* Radius: 6px.
