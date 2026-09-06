import { FactPrecision, type AstrologyChart, type TimeConfidence } from '@astroai/shared-types';
import { astrologyService } from '../../astrology';
import { birthProfileService } from '../../birthProfiles';
import { resolveTopicFromIntent, getTopicMapping, type TopicAstrologyMapping } from './topicMappings';
import type { CoreIntent } from '../intent/intentTypes';

export interface FilteredAstrologyContext {
  available: boolean;
  topic: string;
  birthProfileName: string | null;
  userAge: number | null;
  dateOfBirth: string | null;
  timeConfidence: TimeConfidence | null;
  ascendant: { sign: string; degree: number } | null;
  moonNakshatra: { name: string; pada: number } | null;
  relevantHouses: { number: number; sign?: string; precision: FactPrecision }[];
  relevantPlanets: { planet: string; sign: string; house: number | null; isRetrograde: boolean }[];
  allPlanets: { planet: string; sign: string; house: number | null; isRetrograde: boolean }[];
  currentDasha: { planet: string; antardasha?: string; startDate?: string; endDate?: string } | null;
  summaryText: string;
}

function calculateAge(dobIso: string): number {
  const birthDate = new Date(dobIso);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, isNaN(age) ? 25 : age);
}

export const contextBuilder = {
  async buildAstrologyContext(
    userId: string,
    birthProfileId: string | null,
    intent: CoreIntent,
  ): Promise<FilteredAstrologyContext> {
    const topic = resolveTopicFromIntent(intent);
    const mapping: TopicAstrologyMapping = getTopicMapping(topic);

    if (!birthProfileId) {
      return {
        available: false,
        topic,
        birthProfileName: null,
        userAge: null,
        dateOfBirth: null,
        timeConfidence: null,
        ascendant: null,
        moonNakshatra: null,
        relevantHouses: [],
        relevantPlanets: [],
        allPlanets: [],
        currentDasha: null,
        summaryText: `No birth chart is linked to this session. When relevant, ask for their birth details (DOB, Time, City). Never invent chart placements or planetary degrees.`,
      };
    }

    let timeConfidence: TimeConfidence;
    let birthProfileName: string;
    let userAge: number | null = null;
    let dateOfBirth: string | null = null;
    try {
      const profile = await birthProfileService.getById(userId, birthProfileId);
      timeConfidence = profile.timeConfidence;
      birthProfileName = profile.name;
      dateOfBirth = profile.dateOfBirth;
      userAge = calculateAge(profile.dateOfBirth);
    } catch {
      return {
        available: false,
        topic,
        birthProfileName: null,
        userAge: null,
        dateOfBirth: null,
        timeConfidence: null,
        ascendant: null,
        moonNakshatra: null,
        relevantHouses: [],
        relevantPlanets: [],
        allPlanets: [],
        currentDasha: null,
        summaryText: `Linked birth profile could not be loaded.`,
      };
    }

    try {
      const chart: AstrologyChart = await astrologyService.getChart(userId, birthProfileId);

      // Selectively extract houses relevant to this topic
      const targetedHouses = chart.houses.filter((h) =>
        [...mapping.primaryHouses, ...mapping.secondaryHouses].includes(h.number),
      );

      // Selectively extract planets relevant to this topic
      const targetedPlanets = chart.planetPositions.filter((p) =>
        mapping.keyPlanets.some((kp) => p.planet.toLowerCase().includes(kp.toLowerCase())),
      );

      const dashaInfo = chart.currentDasha
        ? {
            planet: chart.currentDasha.planet,
            antardasha: chart.currentDasha.antardashas[0]?.planet,
            startDate: chart.currentDasha.startDate,
            endDate: chart.currentDasha.endDate,
          }
        : null;

      const lines: string[] = [];
      lines.push(`Topic: ${topic} Focus`);
      lines.push(`Ascendant (Lagna): ${chart.ascendant.sign}, ${chart.ascendant.degree.toFixed(1)}°`);
      lines.push(`Moon Nakshatra: ${chart.moonNakshatra.name} (pada ${chart.moonNakshatra.pada})`);

      if (targetedHouses.length > 0) {
        lines.push(
          `Key Houses: ` +
            targetedHouses.map((h) => `House ${h.number} (${h.sign ?? 'Sign'})`).join(', '),
        );
      }

      if (targetedPlanets.length > 0) {
        lines.push(
          `Key Planets: ` +
            targetedPlanets
              .map(
                (p) =>
                  `${p.planet} in ${p.sign}${p.house ? ` (House ${p.house})` : ''}${p.isRetrograde ? ' [Retrograde]' : ''}`,
              )
              .join('; '),
        );
      }

      if (dashaInfo) {
        lines.push(
          `Current Mahadasha: ${dashaInfo.planet}${dashaInfo.antardasha ? `, Antardasha: ${dashaInfo.antardasha}` : ''}`,
        );
      }

      return {
        available: true,
        topic,
        birthProfileName,
        userAge,
        dateOfBirth,
        timeConfidence,
        ascendant: { sign: chart.ascendant.sign, degree: chart.ascendant.degree },
        moonNakshatra: { name: chart.moonNakshatra.name, pada: chart.moonNakshatra.pada },
        relevantHouses: targetedHouses.map((h) => ({ number: h.number, sign: h.sign, precision: h.precision })),
        relevantPlanets: targetedPlanets,
        allPlanets: chart.planetPositions,
        currentDasha: dashaInfo,
        summaryText: lines.join('\n'),
      };
    } catch {
      return {
        available: false,
        topic,
        birthProfileName,
        userAge: null,
        dateOfBirth: null,
        timeConfidence: null,
        ascendant: null,
        moonNakshatra: null,
        relevantHouses: [],
        relevantPlanets: [],
        allPlanets: [],
        currentDasha: null,
        summaryText: `Astrology engine is currently initializing. Use probabilistic Vedic principles.`,
      };
    }
  },

  buildMockContext(topic: string, overrides: Partial<FilteredAstrologyContext> = {}): FilteredAstrologyContext {
    const isAvailable = overrides.birthProfileName !== null && overrides.available !== false;
    return {
      available: isAvailable,
      topic,
      birthProfileName: overrides.birthProfileName ?? 'Test User',
      userAge: overrides.userAge ?? 28,
      dateOfBirth: overrides.dateOfBirth ?? '1998-05-15',
      timeConfidence: overrides.timeConfidence ?? 'exact',
      ascendant: overrides.ascendant !== undefined ? overrides.ascendant : { sign: 'Leo', degree: 14.2 },
      moonNakshatra: overrides.moonNakshatra !== undefined ? overrides.moonNakshatra : { name: 'Rohini', pada: 2 },
      relevantHouses: overrides.relevantHouses ?? [{ number: 7, sign: 'Aquarius', precision: FactPrecision.RELIABLE }],
      relevantPlanets: overrides.relevantPlanets ?? [{ planet: 'Jupiter', sign: 'Sagittarius', house: 5, isRetrograde: false }],
      allPlanets: overrides.allPlanets ?? [],
      currentDasha: overrides.currentDasha !== undefined ? overrides.currentDasha : { planet: 'Jupiter', antardasha: 'Venus', startDate: '2024-01-01', endDate: '2027-01-01' },
      summaryText: overrides.summaryText ?? `Natal Chart summary for ${topic}: Ascendant in Leo, Moon in Rohini. Active Jupiter Mahadasha.`,
    };
  },
};
