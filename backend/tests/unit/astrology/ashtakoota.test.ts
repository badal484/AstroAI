import { describe, expect, it } from 'vitest';
import type { AstrologyChart } from '@astroai/shared-types';
import { calculateAshtakoota } from '../../../src/modules/astrology/engine/ashtakoota';

function createMockChart(overrides: Partial<AstrologyChart> = {}): AstrologyChart {
  return {
    birthProfileId: 'test_profile_id',
    calculationVersion: 1,
    engineProviderId: 'vedic-v1',
    generatedAt: new Date().toISOString(),
    ascendant: {
      sign: 'aries',
      degree: 15.2,
      precision: 'reliable',
    },
    planetPositions: [
      {
        planet: 'moon',
        sign: 'aries',
        signDegree: 12.5,
        isRetrograde: false,
        nakshatra: 'Ashwini',
        nakshatraPada: 1,
        house: 1,
      },
      {
        planet: 'mars',
        sign: 'taurus',
        signDegree: 15.0,
        isRetrograde: false,
        nakshatra: 'Rohini',
        nakshatraPada: 2,
        house: 2, // Mars in 2nd -> Mangal Dosha
      },
      {
        planet: 'sun',
        sign: 'leo',
        signDegree: 10.0,
        isRetrograde: false,
        nakshatra: 'Magha',
        nakshatraPada: 1,
        house: 5,
      },
    ],
    houses: [],
    moonNakshatra: {
      name: 'Ashwini',
      lord: 'ketu',
      pada: 1,
    },
    currentDasha: null,
    yogas: [],
    ...overrides,
  };
}

describe('Vedic Ashtakoota 36-Points Compatibility Engine', () => {
  it('calculates deterministic Ashtakoota Gunas out of 36 points', () => {
    const chartA = createMockChart({
      moonNakshatra: { name: 'Ashwini', lord: 'ketu', pada: 1 },
      planetPositions: [
        {
          planet: 'moon',
          sign: 'aries',
          signDegree: 10,
          isRetrograde: false,
          nakshatra: 'Ashwini',
          nakshatraPada: 1,
          house: 1,
        },
      ],
    });

    const chartB = createMockChart({
      moonNakshatra: { name: 'Rohini', lord: 'moon', pada: 1 },
      planetPositions: [
        {
          planet: 'moon',
          sign: 'taurus',
          signDegree: 10,
          isRetrograde: false,
          nakshatra: 'Rohini',
          nakshatraPada: 1,
          house: 2,
        },
      ],
    });

    const result = calculateAshtakoota(chartA, chartB);

    expect(result.maxScore).toBe(36);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(36);
    expect(result.categories).toHaveLength(8);

    const varna = result.categories.find((c) => c.name === 'Varna');
    expect(varna).toBeDefined();
    expect(varna?.maxScore).toBe(1);

    const vashya = result.categories.find((c) => c.name === 'Vashya');
    expect(vashya).toBeDefined();
    expect(vashya?.maxScore).toBe(2);

    const tara = result.categories.find((c) => c.name === 'Tara');
    expect(tara).toBeDefined();
    expect(tara?.maxScore).toBe(3);

    const yoni = result.categories.find((c) => c.name === 'Yoni');
    expect(yoni).toBeDefined();
    expect(yoni?.maxScore).toBe(4);

    const graha = result.categories.find((c) => c.name === 'Graha Maitri');
    expect(graha).toBeDefined();
    expect(graha?.maxScore).toBe(5);

    const gana = result.categories.find((c) => c.name === 'Gana');
    expect(gana).toBeDefined();
    expect(gana?.maxScore).toBe(6);

    const bhakoot = result.categories.find((c) => c.name === 'Bhakoot');
    expect(bhakoot).toBeDefined();
    expect(bhakoot?.maxScore).toBe(7);

    const nadi = result.categories.find((c) => c.name === 'Nadi');
    expect(nadi).toBeDefined();
    expect(nadi?.maxScore).toBe(8);
  });

  it('detects Mangal Dosha correctly from planetary positions', () => {
    const chartWithDosha = createMockChart({
      planetPositions: [
        {
          planet: 'mars',
          sign: 'cancer',
          signDegree: 10,
          isRetrograde: false,
          nakshatra: 'Pushya',
          nakshatraPada: 1,
          house: 7, // 7th house Mars
        },
      ],
    });

    const chartWithoutDosha = createMockChart({
      planetPositions: [
        {
          planet: 'mars',
          sign: 'leo',
          signDegree: 10,
          isRetrograde: false,
          nakshatra: 'Magha',
          nakshatraPada: 1,
          house: 5, // 5th house Mars is NOT manglik
        },
      ],
    });

    const result = calculateAshtakoota(chartWithDosha, chartWithoutDosha);
    expect(result.mangalDoshaA).toBe(true);
    expect(result.mangalDoshaB).toBe(false);
  });
});
