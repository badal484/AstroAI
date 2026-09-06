/**
 * Vedic Astrology Knowledge Layer: Gochar (Transit) Principles
 * Classical rules for slow-moving transits (Saturn, Jupiter, Rahu, Ketu) relative to Janma Rashi (Natal Moon) and Lagna.
 */

export interface SadeSatiAnalysis {
  isUnderSadeSati: boolean;
  phase?: 'Rising_Phase_1' | 'Peak_Phase_2' | 'Setting_Phase_3';
  description?: string;
  remedialGuidance?: string;
}

export interface AshtamaKantakaAnalysis {
  isAshtamaShani: boolean; // Saturn 8th from Moon
  isArdhaAshtamaShani: boolean; // Saturn 4th from Moon
  description?: string;
}

export interface JupiterTransitAnalysis {
  relativeHouseFromMoon: number;
  isFavorableFromMoon: boolean;
  dignityTheme: string;
}

/**
 * Calculate Sade Sati phase given Natal Moon sign number (1-12) and Transit Saturn sign number (1-12)
 */
export function calculateSadeSati(natalMoonSign: number, transitSaturnSign: number): SadeSatiAnalysis {
  const diff = ((transitSaturnSign - natalMoonSign + 12) % 12);

  if (diff === 11) {
    // 12th from Moon
    return {
      isUnderSadeSati: true,
      phase: 'Rising_Phase_1',
      description: 'First Phase (12th from Moon): Focus shifts to financial discipline, emotional preparation, managing expenses, and clearing unneeded obligations.',
      remedialGuidance: 'Cultivate mindful spending, maintain calm patience, and avoid speculative financial ventures.'
    };
  } else if (diff === 0) {
    // 1st (Janma) from Moon
    return {
      isUnderSadeSati: true,
      phase: 'Peak_Phase_2',
      description: 'Second/Peak Phase (Janma Shani): Direct impact on physical energy and personal responsibility. Demands integrity, discipline, and emotional maturity.',
      remedialGuidance: 'Prioritize physical rest, steady routine, honest communication, and routine health checks.'
    };
  } else if (diff === 1) {
    // 2nd from Moon
    return {
      isUnderSadeSati: true,
      phase: 'Setting_Phase_3',
      description: 'Third/Setting Phase (2nd from Moon): Transition toward stabilization. Focus on family harmony, consolidating savings, and grounding new habits.',
      remedialGuidance: 'Protect speech from harshness, build savings step-by-step, and respect family elders.'
    };
  }

  return { isUnderSadeSati: false };
}

/**
 * Analyze Saturn Ashtama (8th) or Ardha Ashtama / Kantaka (4th/10th) from Natal Moon
 */
export function calculateKantakaShani(natalMoonSign: number, transitSaturnSign: number): AshtamaKantakaAnalysis {
  const diff = ((transitSaturnSign - natalMoonSign + 12) % 12) + 1;

  if (diff === 8) {
    return {
      isAshtamaShani: true,
      isArdhaAshtamaShani: false,
      description: 'Ashtama Shani (Saturn 8th from Moon): Demands caution in sudden career moves, health vigilance, and non-confrontational conflict resolution.'
    };
  } else if (diff === 4) {
    return {
      isAshtamaShani: false,
      isArdhaAshtamaShani: true,
      description: 'Ardha-Ashtama / Kantaka Shani (Saturn 4th from Moon): Emotional grounding needed at home/domestic environment; focus on peace of mind and property maintenance.'
    };
  }

  return { isAshtamaShani: false, isArdhaAshtamaShani: false };
}

/**
 * Analyze Jupiter Gochar relative to Natal Moon
 * Classical benefic houses from Moon: 2nd, 5th, 7th, 9th, 11th
 */
export function analyzeJupiterGochar(natalMoonSign: number, transitJupiterSign: number): JupiterTransitAnalysis {
  const relativeHouse = ((transitJupiterSign - natalMoonSign + 12) % 12) + 1;
  const auspiciousFromMoon = [2, 5, 7, 9, 11];
  const isFavorable = auspiciousFromMoon.includes(relativeHouse);

  let dignityTheme = '';
  switch (relativeHouse) {
    case 2:
      dignityTheme = 'Expansion of family harmony, wealth accumulation, and eloquent speech.';
      break;
    case 5:
      dignityTheme = 'Blessings in intellect, education, progeny, investment insights, and creative merit.';
      break;
    case 7:
      dignityTheme = 'Auspicious timing for partnership, marital harmony, business expansion, and social alliances.';
      break;
    case 9:
      dignityTheme = 'Supreme dharmic grace, fortune, mentorship, long journeys, and spiritual elevation.';
      break;
    case 11:
      dignityTheme = 'Fulfillment of major desires, gains through elder siblings/networks, and financial Labha.';
      break;
    default:
      dignityTheme = `Jupiter traversing house ${relativeHouse} from Moon: Inward spiritual maturation and dharmic learning.`;
      break;
  }

  return {
    relativeHouseFromMoon: relativeHouse,
    isFavorableFromMoon: isFavorable,
    dignityTheme
  };
}
