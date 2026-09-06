# Vedic Astrology Knowledge Specification

**Document Version:** 1.0.0  
**Target Module:** `backend/src/modules/astrology-knowledge/`  
**Standard:** Parashari Classical Vedic Astrology (Brihat Parashara Hora Shastra)

---

## 1. Knowledge Domain Architecture

The `astrology-knowledge/` module provides a structured, deterministic repository of Vedic rules and significations.

```text
astrology-knowledge/
├── planets/            # Karakatwas, Benefic/Malefic status, Exaltation/Debilitation
├── houses/             # 1st to 12th Bhavas (Kendra, Trikona, Dusthana, Upachaya)
├── signs/              # 12 Rashis (Elements, Qualities, Ruling Lords)
├── nakshatras/         # 27 Lunar Mansions (Deities, Ganas, Yonis, Lords)
├── yogas/              # Raja Yogas, Dhana Yogas, Gaja Kesari, Budhaditya, Kuja Dosha
├── dashas/             # Vimshottari Mahadasha & Antardasha interpretation rules
├── transits/           # Gochar principles (Jupiter transit, Sade Sati, Rahu-Ketu)
├── aspects/            # Vedic Drishti (7th general, Mars 4/8, Jupiter 5/9, Saturn 3/10)
├── dignities/          # Uchha (Exalted), Neecha (Debilitated), Moolatrikona, Swakshetra
├── domains/            # Life-domain synthesis rules (Marriage, Career, Wealth, Education, Health)
└── remedies/           # Sattvic Vedic remedial principles (Daana, Mantra, Seva, Behavioral)
```

---

## 2. Core Vedic Factor Schemas

### A. Planets (Grahas)
* **Sun (Surya)**: Soul (Atma), authority, father, vitality, leadership, government.
* **Moon (Chandra)**: Mind (Manas), mother, emotional patterns, public connection.
* **Mars (Mangal)**: Energy, courage, real estate, brothers, technical execution.
* **Mercury (Budha)**: Intellect, analytical communication, commerce, trade, speech.
* **Jupiter (Guru)**: Wisdom (Jnana), expansion, dharma, guru, children, wealth.
* **Venus (Shukra)**: Love, marriage, aesthetics, vehicles, harmony, diplomacy.
* **Saturn (Shani)**: Discipline, longevity, delays, karma, service, persistence.
* **Rahu**: Ambition, foreign lands, innovative unconventional pursuits, desires.
* **Ketu**: Detachment, spirituality, research, liberation (Moksha), intuition.

### B. Houses (Bhavas)
* **Kendra (1, 4, 7, 10)**: Pillars of life — Self, Domestic Foundation, Partnership, Career.
* **Trikona (1, 5, 9)**: Lakshmi Sthanas — Dharma, Punya, Divine Grace & Fortune.
* **Dusthana (6, 8, 12)**: Obstacles, Transformation, Losses, Spiritual Liberation.
* **Upachaya (3, 6, 10, 11)**: Houses of growth through consistent human effort over time.

---

## 3. Question-to-Factor Vedic Matrix

| Life Domain | Primary Bhava & Lord | Secondary Bhavas | Natural Karakas | Timing Triggers |
| :--- | :--- | :--- | :--- | :--- |
| **Marriage Timing & Harmony** | 7th House & 7th Lord | 2nd (Family), 4th (Domestic), 11th (Fulfilment) | Venus (Shukra), Jupiter (Guru) | 7th Lord / Venus / Jupiter Dasha; Jupiter transit on 7th or Lagna. |
| **Career Growth & Promotion** | 10th House & 10th Lord | 6th (Service), 11th (Gains), 2nd (Wealth) | Sun (Authority), Saturn (Work ethic), Mercury (Commerce) | 10th Lord Dasha; Jupiter transit aspecting 10th; Saturn Sade Sati shifts. |
| **Financial Wealth & Income** | 2nd House (Accumulated) & 11th House (Income) | 5th (Speculation), 9th (Bhagya) | Jupiter (Wealth), Mercury (Trade) | 2nd/11th Lord Dasha; Benefic transit across Dhana Bhavas. |
| **Higher Education / Foreign Studies** | 9th House (Higher Learning) & 12th House (Foreign) | 4th (Foundational), 5th (Intellect) | Jupiter (Knowledge), Mercury (Studies), Rahu (Foreign) | 9th/12th Lord Dasha; Rahu/Jupiter transit on 9th/12th axis. |
| **Property & Vehicles** | 4th House (Sukha Bhava) & 4th Lord | 2nd (Assets), 11th (Fulfilment) | Mars (Land/Property), Venus (Vehicles) | 4th Lord / Mars / Venus Dasha; Benefic transit activating 4th. |
| **Health & Vitality** | 1st House (Lagna Vitality) & 1st Lord | 6th (Diseases), 8th (Longevity) | Sun (Vitality), Mars (Physical strength) | Lagna Lord Dasha; 6th/8th Lord sub-periods with safety guidance. |
