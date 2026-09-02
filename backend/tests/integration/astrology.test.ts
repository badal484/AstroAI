import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeConfidence, FactPrecision } from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { userService } from '../../src/modules/users';
import { AstrologyEngineUnavailableError } from '../../src/shared/errors';
import { signAccessToken } from '../../src/shared/tokens';

const mockEngine = vi.hoisted(() => ({
  providerId: 'fake-test-engine',
  computeChart: vi.fn(),
  computeTransits: vi.fn(),
  computeCompatibility: vi.fn(),
}));

// This is a test double for the engine ABSTRACTION, not a fake production
// result — it lets us verify astrology.service's caching/invalidation/
// precision-policy logic without depending on a real ephemeris provider,
// which is exactly what the interface in engine/astrologyEngine.types.ts
// exists to make possible.
vi.mock('../../src/modules/astrology/engine/registry', () => ({
  CURRENT_CALCULATION_VERSION: 1,
  currentEngine: () => mockEngine,
}));

const app = createApp();

function sampleChart() {
  return {
    ascendant: { sign: 'aries', degree: 12.5, precision: FactPrecision.RELIABLE },
    planetPositions: [],
    houses: [
      { number: 1, sign: 'aries', cuspDegree: 0, planets: [], precision: FactPrecision.RELIABLE },
    ],
    moonNakshatra: { name: 'Ashwini', lord: 'ketu', pada: 1 },
    currentDasha: null,
    yogas: [],
  };
}

async function createAuthedUser() {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Test User',
    avatarUrl: null,
  });
  const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
  return `Bearer ${token}`;
}

async function createProfile(
  authHeader: string,
  timeConfidence: TimeConfidence = TimeConfidence.EXACT,
) {
  const res = await request(app)
    .post('/api/v1/birth-profiles')
    .set('Authorization', authHeader)
    .send({
      name: 'Chart Subject',
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
  return res.body.data.id as string;
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  mockEngine.computeChart.mockReset();
  mockEngine.computeTransits.mockReset();
  mockEngine.computeCompatibility.mockReset();
});

describe('GET /api/v1/astrology/chart/:birthProfileId', () => {
  it('computes via the engine once and serves the persisted result afterwards', async () => {
    mockEngine.computeChart.mockResolvedValue(sampleChart());
    const authHeader = await createAuthedUser();
    const profileId = await createProfile(authHeader);

    const first = await request(app)
      .get(`/api/v1/astrology/chart/${profileId}`)
      .set('Authorization', authHeader);
    const second = await request(app)
      .get(`/api/v1/astrology/chart/${profileId}`)
      .set('Authorization', authHeader);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mockEngine.computeChart).toHaveBeenCalledTimes(1);
    expect(first.body.data.ascendant.precision).toBe('reliable');
  });

  it('forces ascendant/house precision to "unavailable" for an unknown birth time, regardless of the engine\'s own output', async () => {
    mockEngine.computeChart.mockResolvedValue(sampleChart());
    const authHeader = await createAuthedUser();
    const profileId = await createProfile(authHeader, TimeConfidence.UNKNOWN);

    const res = await request(app)
      .get(`/api/v1/astrology/chart/${profileId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.ascendant.precision).toBe('unavailable');
    expect(res.body.data.houses[0].precision).toBe('unavailable');
  });

  it('downgrades to "low_confidence" for an approximate birth time', async () => {
    mockEngine.computeChart.mockResolvedValue(sampleChart());
    const authHeader = await createAuthedUser();
    const profileId = await createProfile(authHeader, TimeConfidence.APPROXIMATE);

    const res = await request(app)
      .get(`/api/v1/astrology/chart/${profileId}`)
      .set('Authorization', authHeader);

    expect(res.body.data.ascendant.precision).toBe('low_confidence');
  });

  it('recomputes after the birth profile is edited', async () => {
    mockEngine.computeChart.mockResolvedValue(sampleChart());
    const authHeader = await createAuthedUser();
    const profileId = await createProfile(authHeader);

    await request(app).get(`/api/v1/astrology/chart/${profileId}`).set('Authorization', authHeader);
    await request(app)
      .patch(`/api/v1/birth-profiles/${profileId}`)
      .set('Authorization', authHeader)
      .send({ birthTime: '09:00' });
    await nextTick();
    await request(app).get(`/api/v1/astrology/chart/${profileId}`).set('Authorization', authHeader);

    expect(mockEngine.computeChart).toHaveBeenCalledTimes(2);
  });

  it('returns 404 for a birth profile owned by someone else', async () => {
    const ownerAuth = await createAuthedUser();
    const profileId = await createProfile(ownerAuth);
    const strangerAuth = await createAuthedUser();

    const res = await request(app)
      .get(`/api/v1/astrology/chart/${profileId}`)
      .set('Authorization', strangerAuth);

    expect(res.status).toBe(404);
  });

  it('surfaces a clear 503 when the engine is not configured, rather than fabricated data', async () => {
    mockEngine.computeChart.mockRejectedValue(new AstrologyEngineUnavailableError());
    const authHeader = await createAuthedUser();
    const profileId = await createProfile(authHeader);

    const res = await request(app)
      .get(`/api/v1/astrology/chart/${profileId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(503);
  });
});

describe('GET /api/v1/astrology/transits/:birthProfileId', () => {
  it('caches transits per date', async () => {
    mockEngine.computeTransits.mockResolvedValue([]);
    const authHeader = await createAuthedUser();
    const profileId = await createProfile(authHeader);

    await request(app)
      .get(`/api/v1/astrology/transits/${profileId}?date=2026-01-01`)
      .set('Authorization', authHeader);
    await request(app)
      .get(`/api/v1/astrology/transits/${profileId}?date=2026-01-01`)
      .set('Authorization', authHeader);
    await request(app)
      .get(`/api/v1/astrology/transits/${profileId}?date=2026-06-01`)
      .set('Authorization', authHeader);

    expect(mockEngine.computeTransits).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/v1/astrology/compatibility', () => {
  it('computes compatibility for two owned profiles', async () => {
    mockEngine.computeCompatibility.mockResolvedValue({
      totalScore: 24,
      maxScore: 36,
      categories: [{ name: 'Mental', score: 5, maxScore: 5, description: 'Great match' }],
    });
    const authHeader = await createAuthedUser();
    const profileIdA = await createProfile(authHeader);
    const profileIdB = await createProfile(authHeader);

    const res = await request(app)
      .post('/api/v1/astrology/compatibility')
      .set('Authorization', authHeader)
      .send({ birthProfileIdA: profileIdA, birthProfileIdB: profileIdB });

    expect(res.status).toBe(200);
    expect(res.body.data.totalScore).toBe(24);
    expect(mockEngine.computeCompatibility).toHaveBeenCalledTimes(1);
  });

  it('rejects compatibility against a profile the caller does not own', async () => {
    const authHeader = await createAuthedUser();
    const profileIdA = await createProfile(authHeader);
    const strangerAuth = await createAuthedUser();
    const profileIdB = await createProfile(strangerAuth);

    const res = await request(app)
      .post('/api/v1/astrology/compatibility')
      .set('Authorization', authHeader)
      .send({ birthProfileIdA: profileIdA, birthProfileIdB: profileIdB });

    expect(res.status).toBe(404);
  });
});
