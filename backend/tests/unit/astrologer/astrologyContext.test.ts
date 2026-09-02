import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FactPrecision, TimeConfidence } from '@astroai/shared-types';
import { userService } from '../../../src/modules/users';
import { birthProfileService } from '../../../src/modules/birthProfiles';
import { buildAstrologyContext } from '../../../src/modules/astrologer/context/astrologyContext';
import { AstrologyEngineUnavailableError } from '../../../src/shared/errors';

const mockEngine = vi.hoisted(() => ({
  providerId: 'fake-test-engine',
  computeChart: vi.fn(),
  computeTransits: vi.fn(),
  computeCompatibility: vi.fn(),
}));

vi.mock('../../../src/modules/astrology/engine/registry', () => ({
  CURRENT_CALCULATION_VERSION: 1,
  currentEngine: () => mockEngine,
}));

function sampleChart() {
  return {
    ascendant: { sign: 'aries', degree: 12.5, precision: FactPrecision.RELIABLE },
    planetPositions: [
      {
        planet: 'venus',
        sign: 'taurus',
        signDegree: 4,
        house: 2,
        nakshatra: 'krittika',
        nakshatraPada: 1,
        isRetrograde: false,
      },
    ],
    houses: [
      { number: 1, sign: 'aries', cuspDegree: 0, planets: [], precision: FactPrecision.RELIABLE },
    ],
    moonNakshatra: { name: 'Ashwini', lord: 'ketu', pada: 1 },
    currentDasha: {
      planet: 'venus',
      startDate: '2020-01-01',
      endDate: '2040-01-01',
      antardashas: [{ planet: 'moon', startDate: '2024-01-01', endDate: '2025-01-01' }],
    },
    yogas: [
      {
        name: 'Gajakesari Yoga',
        description: 'Jupiter-Moon combination',
        planetsInvolved: ['jupiter', 'moon'],
      },
    ],
  };
}

async function createUserAndProfile(timeConfidence: TimeConfidence = TimeConfidence.EXACT) {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Test User',
    avatarUrl: null,
  });
  const profile = await birthProfileService.create(user.id, {
    name: 'Test Subject',
    dateOfBirth: '1990-05-14',
    timeConfidence,
    ...(timeConfidence !== TimeConfidence.UNKNOWN ? { birthTime: '08:30' } : {}),
    location: {
      manual: {
        canonicalName: 'New Delhi, India',
        latitude: 28.6139,
        longitude: 77.209,
        country: 'India',
        countryCode: 'IN',
      },
    },
  });
  return { userId: user.id, profile };
}

beforeEach(() => {
  mockEngine.computeChart.mockReset();
});

describe('buildAstrologyContext', () => {
  it('is unavailable when no birth profile is linked', async () => {
    const context = await buildAstrologyContext('some-user-id', null);
    expect(context.available).toBe(false);
    expect(context.summaryText).toMatch(/no birth profile/i);
  });

  it('is unavailable when the birth profile cannot be found', async () => {
    const { userId } = await createUserAndProfile();
    const context = await buildAstrologyContext(userId, '000000000000000000000000');
    expect(context.available).toBe(false);
    expect(context.summaryText).toMatch(/could not be found/i);
  });

  it('is unavailable (and says so plainly) when the astrology engine is not configured', async () => {
    const { userId, profile } = await createUserAndProfile();
    // The registry is mocked in this file (see top), so simulate the same
    // failure the real unconfigured-engine default produces explicitly.
    mockEngine.computeChart.mockRejectedValue(new AstrologyEngineUnavailableError());

    const context = await buildAstrologyContext(userId, profile.id);

    expect(context.available).toBe(false);
    expect(context.summaryText).toMatch(/not configured/i);
    expect(context.summaryText).not.toMatch(/aries|taurus|venus/i);
  });

  it('formats verified chart facts for prompt injection when available', async () => {
    mockEngine.computeChart.mockResolvedValue(sampleChart());
    const { userId, profile } = await createUserAndProfile();

    const context = await buildAstrologyContext(userId, profile.id);

    expect(context.available).toBe(true);
    expect(context.birthProfileName).toBe('Test Subject');
    expect(context.timeConfidence).toBe(TimeConfidence.EXACT);
    expect(context.summaryText).toMatch(/ascendant.*aries/i);
    expect(context.summaryText).toMatch(/venus in taurus/i);
    expect(context.summaryText).toMatch(/gajakesari yoga/i);
  });

  it('flags ascendant/house facts as unreliable when the birth time is unknown', async () => {
    mockEngine.computeChart.mockResolvedValue({
      ...sampleChart(),
      ascendant: { sign: 'aries', degree: 12.5, precision: FactPrecision.UNAVAILABLE },
      houses: [
        {
          number: 1,
          sign: 'aries',
          cuspDegree: 0,
          planets: [],
          precision: FactPrecision.UNAVAILABLE,
        },
      ],
    });
    const { userId, profile } = await createUserAndProfile(TimeConfidence.UNKNOWN);

    const context = await buildAstrologyContext(userId, profile.id);

    expect(context.timeConfidence).toBe(TimeConfidence.UNKNOWN);
    expect(context.summaryText).toMatch(/not reliable/i);
  });
});
