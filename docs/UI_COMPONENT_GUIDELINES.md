# Astro AI — UI Component Guidelines & Do / Don't Catalog

## 1. Universal Component Principles
Every component in Astro AI must adhere to the design ethos of **restrained modern Indian spiritual technology**.

### Core Rules:
1. **Never use emojis as interface icons**: Use clean geometric SVGs or Lucide icons.
2. **Never use heavy neon purple glow or neon gradients**: Use deep midnight surfaces with warm ivory text and subtle antique gold highlights.
3. **Never trap every single data item inside a floating rounded card**: Use structured list rows, divider lines, and typographic hierarchy.
4. **Never hardcode pricing or credit amounts**: Always bind to backend dynamic pricing models.
5. **Always provide clear visual feedback for all interactive states**: Default, Hover, Active, Focus, Disabled, Loading, Error, and Empty.

---

## 2. Component Guidelines & Anatomy

### 2.1 Buttons (`Button.tsx`)
* **Primary Button**:
  - Purpose: The single main action on a screen (e.g. *"Ask Acharya"*, *"Proceed to Payment"*, *"Save Configuration"*).
  - Background: `#D4A347` (Antique Gold) -> Hover: `#E9C16C` -> Active: `#B88930`.
  - Text: `#0B0F19` (Deep Midnight, 600 SemiBold).
  - Border Radius: `8px`.
  - Height: `44px` (touch friendly).
* **Secondary Button**:
  - Purpose: Complementary actions (e.g. *"View Full Chart"*, *"Filter Results"*, *"Cancel"*).
  - Background: `#1B2236` (Surface Elevated) with 1px border `rgba(255, 255, 255, 0.12)`.
  - Text: `#F8FAFC` (Warm Ivory).
* **Ghost Button**:
  - Purpose: Low-emphasis inline navigation or secondary triggers.
  - Background: `transparent`.
  - Text: `#94A3B8` (Slate).

### 2.2 Inputs & Form Controls (`Input.tsx`, `Select.tsx`)
* **Background**: `#161D2F` (Surface Input).
* **Border**: `1px solid rgba(255, 255, 255, 0.12)`.
* **Focus State**: `1.5px solid #D4A347` with 0px glow.
* **Placeholder Color**: `#64748B`.
* **Error State**: `1.5px solid #EF4444` with human-readable helper message beneath.

### 2.3 Status Badges & Chips (`Badge.tsx`, `VedicChip.tsx`)
* **Astrological Significator Chip**:
  - Background: `rgba(212, 163, 71, 0.08)`.
  - Border: `1px solid rgba(212, 163, 71, 0.25)`.
  - Text: `#E9C16C` (Gold Light, 12px, font-weight 500).
  - Border Radius: `6px`.
* **Operational Status Badges**:
  - `Healthy / Active`: `#10B981` text with `rgba(16, 185, 129, 0.1)` background.
  - `Warning / Degrading`: `#F59E0B` text with `rgba(245, 158, 11, 0.1)` background.
  - `Error / Inactive`: `#EF4444` text with `rgba(239, 68, 68, 0.1)` background.

### 2.4 Astrologer Consultation Messages (`ConsultationMessage.tsx`)
* **Acharya Dialogue**:
  - Background: `#121827` with 1px border `rgba(255, 255, 255, 0.06)`.
  - Typography: 15px font size, 24px line height, Warm Ivory (`#F8FAFC`).
  - Vedic Highlight Elements: Important astrological factors (houses, planets, dashas) styled in `#E2B857` (Gold Accent).
* **Seeker Dialogue**:
  - Background: `#1B2236` with subtle 1px border `rgba(255, 255, 255, 0.1)`.
  - Typography: 14px font size, 20px line height, Crisp Ivory.

### 2.5 Empty & Loading States
* **Empty State**:
  - Clean geometric icon (no sad face emojis).
  - Clear heading explaining the state (e.g. *"No Previous Consultations"*).
  - Descriptive paragraph on what will appear once active.
  - Optional primary CTA button.
* **Loading State**:
  - Skeletons matching the exact geometry of the loading cards or table rows.
  - For AI consultation, contextual status: *"Acharya is studying your 10th House..."* rather than generic spinners.

---

## 3. Visual Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** use deep navy `#0B0F19` with subtle `#121827` surface containers. | **Don't** use multi-color psychedelic neon purple/magenta gradient backgrounds. |
| **Do** use Antique Gold `#D4A347` for purposeful primary highlights and Vedic cues. | **Don't** use gold foil texture or glittering gold borders on every widget. |
| **Do** use clean vector icons with consistent 1.5px stroke weight. | **Don't** use emojis (`🪐`, `✨`, `🔮`, `💰`) as interface navigation icons. |
| **Do** use structured tables with column sorting and subtle divider lines. | **Don't** wrap every single row in its own floating rounded card with a drop shadow. |
| **Do** use restrained border radii: 4px for chips, 8px for buttons/inputs, 12px for cards. | **Don't** make every button, container, and input a 50px giant pill. |
| **Do** show authentic backend states (*"Reading transit factors..."*). | **Don't** show fake progress spinners or generic *"AI is thinking..."* when no work is happening. |
