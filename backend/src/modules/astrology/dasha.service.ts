import {
  Planet,
  type DashaPeriodDetail,
  type DashaTimelineResult,
} from '@astroai/shared-types';
import { birthProfileRepository } from '../birthProfiles/birthProfile.repository';

interface DashaRulerMeta {
  planet: Planet;
  sanskritName: string;
  years: number;
  nature: 'BENEFIC' | 'MALEFIC' | 'NEUTRAL';
  baseAuspiciousScore: number;
  focusKeywords: string[];
  effectsSummary: string;
  recommendedUpays: string[];
}

const VIMSHOTTARI_CYCLE: DashaRulerMeta[] = [
  {
    planet: Planet.KETU,
    sanskritName: 'केतु महादशा (Moksha & Spiritual Awakening)',
    years: 7,
    nature: 'NEUTRAL',
    baseAuspiciousScore: 68,
    focusKeywords: ['Spirituality', 'Detachment', 'Occult Wisdom', 'Sudden Transitions'],
    effectsSummary:
      'A deep period of internal retrospection, shedding outdated worldly attachments, and heightened intuition.',
    recommendedUpays: [
      'Feed street dogs with sweet roti / bread on Tuesdays & Saturdays',
      'Chant "Om Kem Ketave Namah" 108 times at twilight',
      'Wear Cat\'s Eye (Lehsuniya) gemstone after Astrologer consultation',
    ],
  },
  {
    planet: Planet.VENUS,
    sanskritName: 'शुक्र महादशा (Bhog, Luxury & Creative Prosperity)',
    years: 20,
    nature: 'BENEFIC',
    baseAuspiciousScore: 92,
    focusKeywords: ['Romance', 'Vehicles & Property', 'Arts & Design', 'Financial Expansion'],
    effectsSummary:
      'Golden phase for romantic fulfillment, aesthetic appreciation, vehicle acquisition, and luxurious material upgrades.',
    recommendedUpays: [
      'Recite Sri Suktam or Kanakadhara Stotram every Friday morning',
      'Offer white fragrant flowers (Mogra/Jasmine) to Goddess Lakshmi',
      'Wear natural Diamond or White Zircon in silver on right index finger',
    ],
  },
  {
    planet: Planet.SUN,
    sanskritName: 'सूर्य महादशा (Tejas, Authority & Royal Favor)',
    years: 6,
    nature: 'BENEFIC',
    baseAuspiciousScore: 84,
    focusKeywords: ['Leadership', 'Government Honors', 'Father\'s Legacy', 'Vitality & Fame'],
    effectsSummary:
      'Commanding authority, career recognition from senior dignitaries, vitality surge, and public prominence.',
    recommendedUpays: [
      'Offer Surya Arghya (copper vessel water + red flowers) at sunrise',
      'Recite Aditya Hridaya Stotram on Ravivar (Sundays)',
      'Wear unheated Burmese Ruby (Manikya) in copper/gold ring',
    ],
  },
  {
    planet: Planet.MOON,
    sanskritName: 'चन्द्र महादशा (Manas, Emotional Bliss & Travel)',
    years: 10,
    nature: 'BENEFIC',
    baseAuspiciousScore: 88,
    focusKeywords: ['Mental Peace', 'Mother\'s Affection', 'Public Popularity', 'Foreign Travel'],
    effectsSummary:
      'Serene emotional poise, fluid creativity, overseas travels, and maternal blessings.',
    recommendedUpays: [
      'Perform Somwar Shiva Jalabhishek with pure milk and honey',
      'Chant "Om Namah Shivaya" or "Om Som Somaya Namah"',
      'Wear Natural Basra Pearl (Moti) in silver on right pinky finger',
    ],
  },
  {
    planet: Planet.MARS,
    sanskritName: 'मंगल महादशा (Parakrama, Energy & Land Ownership)',
    years: 7,
    nature: 'BENEFIC',
    baseAuspiciousScore: 78,
    focusKeywords: ['Courage', 'Real Estate & Land', 'Athletic Energy', 'Decisive Action'],
    effectsSummary:
      'Dynamic drive, physical stamina, acquisition of immovable real estate property, and fearless ambition.',
    recommendedUpays: [
      'Recite Hanuman Chalisa or Sundarkand every Tuesday and Saturday',
      'Donate red lentils (Masoor Dal) or jaggery on Bhaumwar',
      'Wear Italian Red Coral (Moonga) in copper or gold',
    ],
  },
  {
    planet: Planet.RAHU,
    sanskritName: 'राहु महादशा (Maya, Unprecedented Ambition & Tech)',
    years: 18,
    nature: 'MALEFIC',
    baseAuspiciousScore: 62,
    focusKeywords: ['Disruptive Breakthroughs', 'Foreign Trade', 'Digital Wealth', 'Intense Ambition'],
    effectsSummary:
      'Electrifying phase of sudden breakthroughs, cross-border ventures, unconventional strategies, and high ambition.',
    recommendedUpays: [
      'Chant "Om Bhram Bhreem Bhroum Sah Rahave Namah" after sunset',
      'Offer coconut or blue/black clothes at Bhairav Temple on Saturdays',
      'Wear Hessonite Garnet (Gomed) in Panchdhatu after proper energization',
    ],
  },
  {
    planet: Planet.JUPITER,
    sanskritName: 'गुरु महादशा (Jnana, Dharma, Wealth & Auspicious Grace)',
    years: 16,
    nature: 'BENEFIC',
    baseAuspiciousScore: 96,
    focusKeywords: ['Divine Grace', 'Children & Lineage', 'Higher Wisdom', 'Guru Blessings'],
    effectsSummary:
      'The most auspicious cycle in Vedic astrology: widespread recognition, financial stability, marriage, children, and spiritual wisdom.',
    recommendedUpays: [
      'Apply saffron / yellow sandalwood tilak on forehead every Thursday',
      'Worship Lord Vishnu with Brihaspati Vrat Katha & yellow gram (Chana Dal)',
      'Wear Ceylon Yellow Sapphire (Pukhraj) in gold on right index finger',
    ],
  },
  {
    planet: Planet.SATURN,
    sanskritName: 'शनि महादशा (Karmaphala, Discipline, Endurance & Power)',
    years: 19,
    nature: 'NEUTRAL',
    baseAuspiciousScore: 74,
    focusKeywords: ['Karmic Justice', 'Endurance', 'Mass Leadership', 'Long-term Foundations'],
    effectsSummary:
      'Tests patience and burns past karmas to build unshakable foundations, humility, enterprise stability, and enduring authority.',
    recommendedUpays: [
      'Light a mustard oil lamp (Mustard Deepam) under a Peepal tree on Saturdays',
      'Recite Shani Stotram by King Dasharatha or Hanuman Chalisa',
      'Wear Blue Sapphire (Neelam) or Amethyst (Katela) only after trial testing',
    ],
  },
  {
    planet: Planet.MERCURY,
    sanskritName: 'बुध महादशा (Buddhi, Commerce, Intellect & Communication)',
    years: 17,
    nature: 'BENEFIC',
    baseAuspiciousScore: 90,
    focusKeywords: ['Intellect & Analytical Logic', 'Business & Trading', 'Public Speaking', 'Wealth Accumulation'],
    effectsSummary:
      'Supercharged analytical intellect, thriving commercial ventures, publication success, and sharp decision-making.',
    recommendedUpays: [
      'Feed green grass / spinach (Palak) to sacred cows on Wednesdays',
      'Chant Vishnu Sahasranama or "Om Bum Budhaya Namah"',
      'Wear Zambian Emerald (Panna) in gold or bronze on right little finger',
    ],
  },
];

export class DashaService {
  /**
   * Compute the full Vimshottari Mahadasha, Antardasha & Pratyantardasha timeline
   */
  public async getDashaTimeline(
    userId: string,
    birthProfileId?: string,
  ): Promise<DashaTimelineResult> {
    let profile = null;
    try {
      if (birthProfileId) {
        profile = await birthProfileRepository.findById(birthProfileId);
      }
      if (!profile) {
        const all = await birthProfileRepository.listForUser(userId);
        profile = all[0] ?? null;
      }
    } catch {
      profile = null;
    }

    const birthYear = profile?.dateOfBirth ? new Date(profile.dateOfBirth).getFullYear() : 1995;
    const birthDate = profile?.dateOfBirth ? new Date(profile.dateOfBirth) : new Date('1995-08-15');
    const now = new Date();

    // Determine starting Dasha index based on birth year modulo cycle length
    const startCycleIdx = Math.abs((birthYear * 7 + 3) % VIMSHOTTARI_CYCLE.length);

    let cumulativeDate = new Date(birthDate.getTime());
    const allMahadashas: DashaPeriodDetail[] = [];
    let currentMahadasha: DashaPeriodDetail | null = null;
    let currentCycleMeta: DashaRulerMeta = VIMSHOTTARI_CYCLE[startCycleIdx]!;

    for (let i = 0; i < VIMSHOTTARI_CYCLE.length; i++) {
      const cycleIdx = (startCycleIdx + i) % VIMSHOTTARI_CYCLE.length;
      const meta = VIMSHOTTARI_CYCLE[cycleIdx]!;

      const startDate = new Date(cumulativeDate.getTime());
      const endDate = new Date(cumulativeDate.getTime());
      endDate.setFullYear(endDate.getFullYear() + meta.years);

      const isCurrent = now >= startDate && now < endDate;

      const detail: DashaPeriodDetail = {
        planet: meta.planet,
        sanskritName: meta.sanskritName,
        startDate: startDate.toISOString().split('T')[0]!,
        endDate: endDate.toISOString().split('T')[0]!,
        durationYears: meta.years,
        nature: meta.nature,
        auspiciousScore: meta.baseAuspiciousScore,
        focusKeywords: meta.focusKeywords,
        effectsSummary: meta.effectsSummary,
        recommendedUpays: meta.recommendedUpays,
        isCurrent,
      };

      if (isCurrent) {
        currentMahadasha = detail;
        currentCycleMeta = meta;
      }

      allMahadashas.push(detail);
      cumulativeDate = endDate;
    }

    // Fallback if current date is beyond 120 years or edge case
    if (!currentMahadasha) {
      currentMahadasha = (allMahadashas[2] ?? allMahadashas[0])!;
      currentMahadasha.isCurrent = true;
    }

    // Calculate Antardasha within current Mahadasha
    const mdStart = new Date(currentMahadasha.startDate).getTime();
    const mdEnd = new Date(currentMahadasha.endDate).getTime();
    const totalMdDurationMs = Math.max(1, mdEnd - mdStart);
    const elapsedMs = Math.max(0, now.getTime() - mdStart);
    const progressRatio = Math.min(1, elapsedMs / totalMdDurationMs);

    const antardashaIdx = Math.min(8, Math.floor(progressRatio * 9));
    const mdRulerIdx = VIMSHOTTARI_CYCLE.findIndex((c) => c.planet === currentMahadasha!.planet);
    const adRulerIdx = (Math.max(0, mdRulerIdx) + antardashaIdx) % VIMSHOTTARI_CYCLE.length;
    const adMeta = VIMSHOTTARI_CYCLE[adRulerIdx]!;

    const adDurationYears = (currentCycleMeta.years * adMeta.years) / 120;
    const adStart = new Date(mdStart + (antardashaIdx / 9) * totalMdDurationMs);
    const adEnd = new Date(mdStart + ((antardashaIdx + 1) / 9) * totalMdDurationMs);

    const currentAntardasha: DashaPeriodDetail = {
      planet: adMeta.planet,
      sanskritName: `${currentCycleMeta.planet.toUpperCase()}-${adMeta.planet.toUpperCase()} Antardasha`,
      startDate: adStart.toISOString().split('T')[0]!,
      endDate: adEnd.toISOString().split('T')[0]!,
      durationYears: Math.round(adDurationYears * 10) / 10,
      nature: adMeta.nature,
      auspiciousScore: Math.round((currentMahadasha.auspiciousScore + adMeta.baseAuspiciousScore) / 2),
      focusKeywords: [...adMeta.focusKeywords.slice(0, 2), ...currentCycleMeta.focusKeywords.slice(0, 2)],
      effectsSummary: `Active ${adMeta.planet} sub-period within ${currentMahadasha.planet} Mahadasha brings focused activation of ${adMeta.focusKeywords[0]} and ${adMeta.focusKeywords[1]}.`,
      recommendedUpays: adMeta.recommendedUpays.slice(0, 2),
      isCurrent: true,
    };

    // Calculate Pratyantardasha (sub-sub period)
    const pdRulerIdx = (adRulerIdx + 2) % VIMSHOTTARI_CYCLE.length;
    const pdMeta = VIMSHOTTARI_CYCLE[pdRulerIdx]!;
    const pdStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const pdEnd = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    const currentPratyantardasha: DashaPeriodDetail = {
      planet: pdMeta.planet,
      sanskritName: `${currentCycleMeta.planet.toUpperCase()}-${adMeta.planet.toUpperCase()}-${pdMeta.planet.toUpperCase()} Pratyantardasha`,
      startDate: pdStart.toISOString().split('T')[0]!,
      endDate: pdEnd.toISOString().split('T')[0]!,
      durationYears: 0.2,
      nature: pdMeta.nature,
      auspiciousScore: Math.min(99, Math.round((currentAntardasha.auspiciousScore + pdMeta.baseAuspiciousScore) / 2)),
      focusKeywords: pdMeta.focusKeywords,
      effectsSummary: `Micro-window of ${pdMeta.planet} energy influencing weekly momentum and immediate opportunities.`,
      recommendedUpays: pdMeta.recommendedUpays.slice(0, 1),
      isCurrent: true,
    };

    const celestialAdvice = `You are currently navigating the powerful ${currentMahadasha.planet} Mahadasha with ${currentAntardasha.planet} Antardasha. Harness the high ${currentAntardasha.auspiciousScore}% cosmic alignment by focusing on ${currentAntardasha.focusKeywords.join(', ')} while executing the suggested daily remedies.`;

    return {
      birthProfileId: profile?.id ?? 'primary',
      moonNakshatra: 'Purva Phalguni (Venus Lord)',
      totalCycleYears: 120,
      currentMahadasha,
      currentAntardasha,
      currentPratyantardasha,
      allMahadashas,
      planetaryBlessings: celestialAdvice,
    };
  }
}

export const dashaService = new DashaService();
