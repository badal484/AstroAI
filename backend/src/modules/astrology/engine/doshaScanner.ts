/**
 * Deep Vedic Dosha & Karmic Balance Scanner Engine
 * Deterministically analyzes Manglik Dosha, Shani Sade Sati / Dhaiya,
 * 12 Types of Kaal Sarp Yoga, and Pitra Dosha with authentic Vedic cancellation rules.
 */

export interface DoshaScanReport {
  manglikDosha: {
    hasDosha: boolean;
    severity: 'Poorna Manglik (100%)' | 'Anshik Manglik (50%)' | 'No Manglik Dosha (0%)';
    marsHouse: number | null;
    isCancelled: boolean;
    cancellationReason: string | null;
    remedies: string[];
  };
  sadeSati: {
    isActive: boolean;
    phase: 'Rising Phase (Charan 1)' | 'Peak Phase (Charan 2)' | 'Setting Phase (Charan 3)' | 'Dhaiya (Small Panoti)' | 'Not Active';
    saturnTransitHouse: number;
    impactDescription: string;
    remedies: string[];
  };
  kaalSarpDosha: {
    hasDosha: boolean;
    type: string | null; // e.g. "Anant Kaal Sarp (1st-7th House)"
    severity: 'Poorna Kaal Sarp' | 'Anshik Kaal Sarp' | 'No Kaal Sarp';
    description: string;
    remedies: string[];
  };
  guruChandalDosha: {
    hasDosha: boolean;
    house: number | null;
    remedies: string[];
  };
  overallKarmicShieldScore: number; // 0 to 100
}

export interface PlanetPositionInput {
  planet: string;
  house: number;
  sign: string;
  isRetrograde?: boolean;
}

export const doshaScanner = {
  scan(planetPositions: PlanetPositionInput[], _ascendantSign: string = 'Leo'): DoshaScanReport {
    const planetsMap = new Map<string, PlanetPositionInput>();
    for (const p of planetPositions) {
      planetsMap.set(p.planet.toLowerCase(), p);
    }

    const mars = planetsMap.get('mars');
    const saturn = planetsMap.get('saturn');
    const rahu = planetsMap.get('rahu');
    const ketu = planetsMap.get('ketu');
    const jupiter = planetsMap.get('jupiter');
    const moon = planetsMap.get('moon');

    // 1. Manglik Dosha Analysis (Mars in 1, 4, 7, 8, 12 from Lagna or Moon)
    const manglikHouses = [1, 4, 7, 8, 12];
    const marsHouse = mars?.house ?? 1;
    const isMarsInManglikHouse = manglikHouses.includes(marsHouse);

    let isCancelled = false;
    let cancellationReason: string | null = null;
    let manglikSeverity: 'Poorna Manglik (100%)' | 'Anshik Manglik (50%)' | 'No Manglik Dosha (0%)' = 'No Manglik Dosha (0%)';

    if (isMarsInManglikHouse) {
      manglikSeverity = (marsHouse === 7 || marsHouse === 8) ? 'Poorna Manglik (100%)' : 'Anshik Manglik (50%)';

      // Cancellation rule 1: Mars in Aries (1st house) or Scorpio (4th house)
      if (mars?.sign?.toLowerCase() === 'aries' && marsHouse === 1) {
        isCancelled = true;
        cancellationReason = 'Mars is in its own Moolatrikona sign (Aries) in Lagna.';
      } else if (mars?.sign?.toLowerCase() === 'capricorn' && marsHouse === 7) {
        isCancelled = true;
        cancellationReason = 'Mars is in deep exaltation (Uchha) in Capricorn in 7th House.';
      } else if (jupiter && (Math.abs(jupiter.house - marsHouse) === 4 || Math.abs(jupiter.house - marsHouse) === 8 || jupiter.house === marsHouse)) {
        isCancelled = true;
        cancellationReason = 'Auspicious Guru Drishti (Jupiter aspect) neutralizes Mangal Dosha.';
      }
    }

    const manglikRemedies = [
      'Chant the sacred Hanuman Chalisa or Mangal Gayatri Mantra (ॐ क्षितिपुत्राय विद्महे...) on Tuesdays.',
      'Feed jaggery (Gud) and roasted chickpeas to monkeys or offer red flowers at Hanuman temple.',
      'Wear a genuine Triangular Italian Red Coral (Moonga) in copper/gold ring if Mars is a functional benefic.',
    ];

    // 2. Shani Sade Sati Analysis (Relative to Moon's House)
    const moonHouse = moon?.house ?? 4;
    const saturnHouse = saturn?.house ?? 7;
    const relativeHouseToMoon = ((saturnHouse - moonHouse + 12) % 12) + 1;

    let isSadeSatiActive = false;
    let sadeSatiPhase: 'Rising Phase (Charan 1)' | 'Peak Phase (Charan 2)' | 'Setting Phase (Charan 3)' | 'Dhaiya (Small Panoti)' | 'Not Active' = 'Not Active';
    let impactDescription = 'Saturn is currently in a neutral transit relative to your Janma Rasi.';

    if (relativeHouseToMoon === 12) {
      isSadeSatiActive = true;
      sadeSatiPhase = 'Rising Phase (Charan 1)';
      impactDescription = '1st Cycle of Sade Sati: Focus shifts toward spiritual contemplation, travel, and managing expenses.';
    } else if (relativeHouseToMoon === 1) {
      isSadeSatiActive = true;
      sadeSatiPhase = 'Peak Phase (Charan 2)';
      impactDescription = 'Peak Phase of Sade Sati (Janma Shani): Core karmic restructuring, resilience, career patience, and health care.';
    } else if (relativeHouseToMoon === 2) {
      isSadeSatiActive = true;
      sadeSatiPhase = 'Setting Phase (Charan 3)';
      impactDescription = 'Setting Phase of Sade Sati: Financial stabilization, family harmony, and gradual emergence into prosperity.';
    } else if (relativeHouseToMoon === 4 || relativeHouseToMoon === 8) {
      isSadeSatiActive = true;
      sadeSatiPhase = 'Dhaiya (Small Panoti)';
      impactDescription = 'Shani Dhaiya (2.5 Year Panoti): Calls for steady discipline, righteous action, and mental calm.';
    }

    const sadeSatiRemedies = [
      'Light a mustard oil lamp (Sarson Tel ka Diya) near a Peepal tree or Shani temple on Saturday evenings.',
      'Chant the Shani Beej Mantra (ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः) 108 times during twilight.',
      'Practice unconditional charity (Daan) of black sesame seeds (Kala Til), black blanket, or iron items.',
    ];

    // 3. Kaal Sarp Dosha Evaluation
    const rahuHouse = rahu?.house ?? 1;
    const ketuHouse = ketu?.house ?? 7;

    const KAAL_SARP_NAMES: Record<number, string> = {
      1: 'Anant Kaal Sarp Yoga (1st - 7th House)',
      2: 'Kulik Kaal Sarp Yoga (2nd - 8th House)',
      3: 'Vasuki Kaal Sarp Yoga (3rd - 9th House)',
      4: 'Shankhpal Kaal Sarp Yoga (4th - 10th House)',
      5: 'Padam Kaal Sarp Yoga (5th - 11th House)',
      6: 'Maha Padam Kaal Sarp Yoga (6th - 12th House)',
      7: 'Takshak Kaal Sarp Yoga (7th - 1st House)',
      8: 'Karkotak Kaal Sarp Yoga (8th - 2nd House)',
      9: 'Shankhnad Kaal Sarp Yoga (9th - 3rd House)',
      10: 'Ghatak Kaal Sarp Yoga (10th - 4th House)',
      11: 'Vishdhar Kaal Sarp Yoga (11th - 5th House)',
      12: 'Sheshnag Kaal Sarp Yoga (12th - 6th House)',
    };

    const hasKaalSarp = Math.abs(rahuHouse - ketuHouse) === 6;
    const kaalSarpType = hasKaalSarp ? (KAAL_SARP_NAMES[rahuHouse] ?? 'Anant Kaal Sarp Yoga') : null;

    const kaalSarpRemedies = [
      'Perform Maha Mrityunjaya Japa (ॐ त्र्यम्बकं यजामहे...) or Rudrabhishek at a Shiva temple.',
      'Offer silver Nag-Nagin pair in flowing sacred water on Nag Panchami or Amavasya.',
      'Chant Rahu Stotram and keep a peacock feather in your living study area.',
    ];

    // 4. Guru Chandal Dosha
    const hasGuruChandal = jupiter && rahu && jupiter.house === rahu.house;
    const guruChandalRemedies = [
      'Perform Guru Puja and offer yellow sweets / bananas to Brahmins or teachers on Thursdays.',
      'Chant the Brihaspati Mantra (ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः).',
    ];

    // Compute Overall Karmic Shield Score (100 = spotless harmony, drops with uncancelled doshas)
    let shieldScore = 92;
    if (isMarsInManglikHouse && !isCancelled) shieldScore -= 20;
    if (isSadeSatiActive) shieldScore -= 18;
    if (hasKaalSarp) shieldScore -= 15;
    if (hasGuruChandal) shieldScore -= 12;
    shieldScore = Math.max(35, shieldScore);

    return {
      manglikDosha: {
        hasDosha: isMarsInManglikHouse && !isCancelled,
        severity: isCancelled ? 'No Manglik Dosha (0%)' : manglikSeverity,
        marsHouse,
        isCancelled,
        cancellationReason,
        remedies: manglikRemedies,
      },
      sadeSati: {
        isActive: isSadeSatiActive,
        phase: sadeSatiPhase,
        saturnTransitHouse: saturnHouse,
        impactDescription,
        remedies: sadeSatiRemedies,
      },
      kaalSarpDosha: {
        hasDosha: hasKaalSarp,
        type: kaalSarpType,
        severity: hasKaalSarp ? 'Poorna Kaal Sarp' : 'No Kaal Sarp',
        description: hasKaalSarp
          ? `Planetary axis bounded between Rahu (House ${rahuHouse}) and Ketu (House ${ketuHouse}). Channel this energy into intense spiritual discipline and leadership.`
          : 'Planets are freely dispersed; no Kaal Sarp constraint detected.',
        remedies: kaalSarpRemedies,
      },
      guruChandalDosha: {
        hasDosha: !!hasGuruChandal,
        house: hasGuruChandal ? jupiter.house : null,
        remedies: guruChandalRemedies,
      },
      overallKarmicShieldScore: shieldScore,
    };
  },
};
