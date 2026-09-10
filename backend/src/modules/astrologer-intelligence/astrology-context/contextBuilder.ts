import { FactPrecision, type TimeConfidence, type Transit } from '@astroai/shared-types';
import { astrologyService } from '../../astrology';
import { birthProfileService } from '../../birthProfiles';
import { resolveTopicFromIntent, getTopicMapping, type TopicAstrologyMapping } from './topicMappings';
import { CoreIntent } from '../intent/intentTypes';
import { astrologyEvidenceEngine, type AstrologyEvidencePacket } from '../reasoning/astrologyEvidence';

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
  evidencePacket?: AstrologyEvidencePacket;
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

import { prashnaEngine } from './prashnaEngine';
import type { PlanetPosition } from '@astroai/shared-types';

export interface TestChartFixture {
  name: string;
  timeConfidence: TimeConfidence;
  userAge?: number;
  dateOfBirth?: string;
  chart: {
    ascendant: { sign: string; degree: number };
    moonNakshatra: { name: string; pada: number };
    houses: { number: number; sign?: string; precision: FactPrecision }[];
    planetPositions: PlanetPosition[];
    currentDasha?: { planet: string; antardashas: { planet: string }[]; startDate?: string; endDate?: string } | null;
  };
  transits?: Transit[];
}

const testChartRegistry = new Map<string, TestChartFixture>();

export function registerTestChartFixture(id: string, fixture: TestChartFixture): void {
  testChartRegistry.set(id, fixture);
}

export function clearTestChartFixtures(): void {
  testChartRegistry.clear();
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
      const prashna = prashnaEngine.castPrashna();
      return {
        available: false,
        topic,
        birthProfileName: null,
        userAge: null,
        dateOfBirth: null,
        timeConfidence: null,
        ascendant: { sign: prashna.prashnaLagna, degree: 15.0 },
        moonNakshatra: { name: prashna.moonNakshatra, pada: 1 },
        relevantHouses: [],
        relevantPlanets: [],
        allPlanets: [],
        currentDasha: null,
        summaryText: `No natal chart linked. Live Prashna (Horary) Chart computed: Prashna Lagna in ${prashna.prashnaLagna} (Lord: ${prashna.lagnaLord}), Moon in ${prashna.moonNakshatra} (${prashna.moonSign}). Current Choghadiya: ${prashna.currentChoghadiya.name}. Rahu Kaal: ${prashna.rahuKaal}. Abhijit Muhurat: ${prashna.abhijitMuhurat}. Horary Assessment: ${prashna.verdict}.`,
      };
    }

    const testFixture = testChartRegistry.get(birthProfileId);
    if (testFixture) {
      const timeConfidence = testFixture.timeConfidence;
      const birthProfileName = testFixture.name;
      const dateOfBirth = testFixture.dateOfBirth ?? '1998-01-01';
      const userAge = testFixture.userAge ?? 27;

      const chart = testFixture.chart;
      const transits = testFixture.transits ?? [];

      const targetedHouses = chart.houses.filter((h) =>
        [...mapping.primaryHouses, ...mapping.secondaryHouses].includes(h.number),
      );

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

      const evidencePacket = astrologyEvidenceEngine.synthesizeEvidence({
        intent,
        chartAvailable: true,
        timeConfidence,
        ascendant: { sign: chart.ascendant.sign, degree: chart.ascendant.degree },
        moonNakshatra: { name: chart.moonNakshatra.name, pada: chart.moonNakshatra.pada },
        houses: targetedHouses.map((h) => ({ number: h.number, sign: h.sign, precision: h.precision })),
        planets: chart.planetPositions,
        dasha: dashaInfo,
        transits,
        userAge,
        userName: birthProfileName,
      });

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
                  `${p.planet} in ${p.sign}${p.house ? ` (H${p.house})` : ''}${p.isRetrograde ? ' [Vakri]' : ''}`,
              )
              .join(', '),
        );
      }

      if (dashaInfo) {
        lines.push(
          `Current Period: Mahadasha of ${dashaInfo.planet}${dashaInfo.antardasha ? ` / Antardasha of ${dashaInfo.antardasha}` : ''}`,
        );
      }

      return {
        available: true,
        topic,
        birthProfileName,
        userAge,
        dateOfBirth,
        timeConfidence,
        ascendant: chart.ascendant,
        moonNakshatra: chart.moonNakshatra,
        relevantHouses: targetedHouses,
        relevantPlanets: targetedPlanets.map((p) => ({
          planet: p.planet,
          sign: p.sign,
          house: p.house ?? null,
          isRetrograde: p.isRetrograde ?? false,
        })),
        allPlanets: chart.planetPositions.map((p) => ({
          planet: p.planet,
          sign: p.sign,
          house: p.house ?? null,
          isRetrograde: p.isRetrograde ?? false,
        })),
        currentDasha: dashaInfo,
        summaryText: lines.join('\n'),
        evidencePacket,
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
      const [chart, transits] = await Promise.all([
        astrologyService.getChart(userId, birthProfileId),
        astrologyService.getTransits(userId, birthProfileId).catch(() => [] as Transit[]),
      ]);

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

      const evidencePacket = astrologyEvidenceEngine.synthesizeEvidence({
        intent,
        chartAvailable: true,
        timeConfidence,
        ascendant: { sign: chart.ascendant.sign, degree: chart.ascendant.degree },
        moonNakshatra: { name: chart.moonNakshatra.name, pada: chart.moonNakshatra.pada },
        houses: targetedHouses.map((h) => ({ number: h.number, sign: h.sign, precision: h.precision })),
        planets: chart.planetPositions,
        dasha: dashaInfo,
        transits,
        userAge,
        userName: birthProfileName,
      });

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

      if (transits.length > 0) {
        lines.push(
          `Key Transits (Gochara): ` +
            transits
              .slice(0, 3)
              .map((t) => `${t.planet} in ${t.sign}${t.house ? ` (House ${t.house})` : ''}`)
              .join(', '),
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
        evidencePacket,
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

    const resolveIntentFromTopic = (t: string): CoreIntent => {
      if (t === 'MARRIAGE') return CoreIntent.MARRIAGE_TIMING;
      if (t === 'RELATIONSHIP' || t === 'RELATIONSHIP_CONFLICT') return CoreIntent.RELATIONSHIP_CONFLICT;
      if (t === 'CAREER' || t === 'JOB_CHANGE') return CoreIntent.CAREER_GENERAL;
      if (t === 'FINANCE') return CoreIntent.FINANCE_GENERAL;
      if (t === 'EDUCATION') return CoreIntent.EDUCATION_ACADEMICS;
      if (t === 'FOREIGN_TRAVEL') return CoreIntent.FOREIGN_TRAVEL;
      return CoreIntent.GENERAL_LIFE_READING;
    };

    const defaultHouses = topic === 'CAREER' || topic === 'JOB_CHANGE'
      ? [{ number: 10, sign: 'Taurus', precision: FactPrecision.RELIABLE }]
      : topic === 'FINANCE'
        ? [{ number: 2, sign: 'Taurus', precision: FactPrecision.RELIABLE }, { number: 11, sign: 'Pisces', precision: FactPrecision.RELIABLE }]
        : [{ number: 7, sign: 'Aquarius', precision: FactPrecision.RELIABLE }];

    const mockEvidence = isAvailable
      ? astrologyEvidenceEngine.synthesizeEvidence({
          intent: resolveIntentFromTopic(topic),
          chartAvailable: true,
          timeConfidence: overrides.timeConfidence ?? 'exact',
          ascendant: overrides.ascendant !== undefined ? overrides.ascendant : { sign: 'Leo', degree: 14.2 },
          moonNakshatra: overrides.moonNakshatra !== undefined ? overrides.moonNakshatra : { name: 'Rohini', pada: 2 },
          houses: overrides.relevantHouses ?? defaultHouses,
          planets: overrides.relevantPlanets as any ?? [{ planet: 'Jupiter', sign: 'Sagittarius', house: 5, isRetrograde: false }],
          dasha: overrides.currentDasha ?? { planet: 'Jupiter', antardasha: 'Venus', startDate: '2024-01-01', endDate: '2027-01-01' },
          userAge: overrides.userAge ?? 28,
          userName: overrides.birthProfileName ?? 'Test User',
        })
      : undefined;

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
      evidencePacket: overrides.evidencePacket ?? mockEvidence,
    };
  },
};
