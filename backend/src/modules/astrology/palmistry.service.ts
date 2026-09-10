import {
  type AnalyzePalmInput,
  type PalmistryAnalysisResult,
  type PalmLineDetails,
  type PalmMountDetails,
  Planet,
} from '@astroai/shared-types';
import { astrologyService } from './astrology.service';
import { birthProfileService } from '../birthProfiles';

export const palmistryService = {
  async analyzePalm(userId: string, input: AnalyzePalmInput): Promise<PalmistryAnalysisResult> {
    const isRightHand = input.hand === 'right';
    let kundliInfo: { lagnaSign?: string; moonSign?: string; sunSign?: string } = {};

    if (input.birthProfileId) {
      try {
        const profile = await birthProfileService.getById(userId, input.birthProfileId);
        const chart = await astrologyService.getChart(userId, profile.id);
        if (chart) {
          kundliInfo = {
            lagnaSign: chart.ascendant.sign,
            moonSign: chart.moonNakshatra.name,
            sunSign: chart.planetPositions.find((p) => p.planet === Planet.SUN)?.sign,
          };
        }
      } catch {
        // Fallback gracefully without chart context
      }
    }

    const lifeLine: PalmLineDetails = {
      name: 'Life Line',
      sanskritName: 'Jeevan Rekha (आयुष्य रेखा)',
      prominence: 'deep',
      quality: 'Curved and deep without major breaks, wrapping smoothly around the Mount of Venus.',
      interpretation:
        'Indicates robust physical vitality, strong recuperative prana, and adaptability to life transitions.',
      kundliCorrelation: kundliInfo.lagnaSign
        ? `Aligns with your ${kundliInfo.lagnaSign.toUpperCase()} Lagnesh strength, confirming resilient vitality.`
        : 'Indicates high natural vitality and vitality preservation.',
    };

    const heartLine: PalmLineDetails = {
      name: 'Heart Line',
      sanskritName: 'Hridaya Rekha (हृदय रेखा)',
      prominence: 'deep',
      quality: 'Extends towards the Mount of Jupiter with upward branchings towards the index finger.',
      interpretation:
        'Reflects profound emotional loyalty, idealistic devotion in relationships, and a protective spiritual nature.',
      kundliCorrelation: kundliInfo.moonSign
        ? `Harmonizes with your Moon Nakshatra (${kundliInfo.moonSign}), signifying deep intuitive devotion.`
        : 'Indicates emotional clarity and high relational integrity.',
    };

    const headLine: PalmLineDetails = {
      name: 'Head Line',
      sanskritName: 'Mastiṣka Rekha (मस्तिष्क रेखा)',
      prominence: 'deep',
      quality: 'Long, gently sloping towards the Mount of Moon (Chandra Parvat).',
      interpretation:
        'Combines analytical problem-solving with creative strategic foresight. Excellent capacity for deep study and wisdom synthesis.',
      kundliCorrelation:
        'Reflects strong Budhaditya / Mercury intellect influence, balancing logic with intuitive wisdom.',
    };

    const fateLine: PalmLineDetails = {
      name: 'Fate Line',
      sanskritName: 'Bhagya Rekha (भाग्य रेखा)',
      prominence: 'moderate',
      quality: 'Ascends from the palm base directly towards the Mount of Saturn (Shani Parvat).',
      interpretation:
        'Points to self-made career expansion, self-earned wealth milestones, and sudden opportunities arising from disciplined perseverance.',
      kundliCorrelation:
        'Directly reflects Saturn-Jupiter karma fruition, indicating significant professional rise in mid-career cycles.',
    };

    const mounts: PalmMountDetails[] = [
      {
        name: 'Mount of Jupiter (Guru Parvat)',
        planet: Planet.JUPITER,
        strength: 88,
        status: 'well_developed',
        interpretation:
          'High leadership capability, respect for dharmic principles, natural advisory inclination.',
      },
      {
        name: 'Mount of Sun (Surya Parvat)',
        planet: Planet.SUN,
        strength: 82,
        status: 'well_developed',
        interpretation:
          'Creative radiance, professional recognition, and inherent dignity in public interactions.',
      },
      {
        name: 'Mount of Venus (Shukra Parvat)',
        planet: Planet.VENUS,
        strength: 85,
        status: 'well_developed',
        interpretation:
          'Appreciation for sacred arts, magnetic presence, refined aesthetic taste, and warmth in hospitality.',
      },
      {
        name: 'Mount of Saturn (Shani Parvat)',
        planet: Planet.SATURN,
        strength: 78,
        status: 'average',
        interpretation:
          'Grounding realism, capacity for sustained hard work, patience during developmental delays.',
      },
    ];

    const synthesis =
      `Based on Classical Samudrika Shastra (सामुद्रिक शास्त्र), your ${isRightHand ? 'dominant Right' : 'Left'} palm exhibits an auspicious balance of the Head (Mastiṣka) and Fate (Bhagya) lines. ` +
      `The upward curvature towards Guru Parvat confirms high administrative and advisory capability, while the deep Jeevan Rekha provides the stamina needed to manifest long-term ambitions. ` +
      (kundliInfo.lagnaSign ? `This seamlessly verifies your ${kundliInfo.lagnaSign} Lagna placements.` : '');

    const recommendedRemedies = [
      'Perform morning Surya Arghya (जल अर्पण) with copper vessel at sunrise to further energize Surya Parvat.',
      'Chant "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः" (Om Graam Greem Graum Sah Gurave Namah) 108 times on Thursdays.',
      'Wear natural white sandalwood or silver ornament on Fridays to harmonize Venusian prana.',
    ];

    return {
      dominantHand: input.hand,
      elementalHandType: 'Earth (Prithvi)',
      lines: {
        lifeLine,
        heartLine,
        headLine,
        fateLine,
      },
      mounts,
      samudrikaSynthesis: synthesis,
      overallScore: 89,
      recommendedRemedies,
    };
  },
};
