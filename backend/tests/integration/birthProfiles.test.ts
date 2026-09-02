import { DateTime } from 'luxon';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { userService } from '../../src/modules/users';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

async function createAuthedUser() {
  const user = await userService.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Test User',
    avatarUrl: null,
  });
  const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
  return { user, authHeader: `Bearer ${token}` };
}

function manualLocation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    manual: {
      canonicalName: 'New Delhi, India',
      latitude: 28.6139,
      longitude: 77.209,
      country: 'India',
      countryCode: 'IN',
      ...overrides,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/v1/birth-profiles', () => {
  it('creates a profile with an exact birth time and manually-entered location', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Asha',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'exact',
        birthTime: '08:30',
        location: manualLocation(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'Asha',
      dateOfBirth: '1990-05-14',
      birthTime: '08:30',
      timeConfidence: 'exact',
      location: { timezone: 'Asia/Kolkata', country: 'India' },
    });
  });

  it('rejects a future date of birth', async () => {
    const { authHeader } = await createAuthedUser();
    const future = DateTime.now().plus({ years: 2 }).toFormat('yyyy-LL-dd');

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Future Person',
        dateOfBirth: future,
        timeConfidence: 'unknown',
        location: manualLocation(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FUTURE_DATE_OF_BIRTH');
  });

  it('rejects a calendar-invalid date (Feb 30)', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Invalid Date',
        dateOfBirth: '1990-02-30',
        timeConfidence: 'unknown',
        location: manualLocation(),
      });

    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range time value at the wire level', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Bad Time',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'exact',
        birthTime: '25:99',
        location: manualLocation(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a birth time submitted alongside "unknown" confidence', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Confused',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'unknown',
        birthTime: '08:30',
        location: manualLocation(),
      });

    expect(res.status).toBe(400);
  });

  it('rejects "exact" confidence without a birth time', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Missing Time',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'exact',
        location: manualLocation(),
      });

    expect(res.status).toBe(400);
  });

  it('accepts "unknown" confidence with no birth time at all', async () => {
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Unknown Time',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'unknown',
        location: manualLocation(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.birthTime).toBeNull();
  });

  it('resolves a location by placeId through the configured provider', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: 'OK',
            results: [
              {
                place_id: 'place-tokyo',
                formatted_address: 'Tokyo, Japan',
                geometry: { location: { lat: 35.6762, lng: 139.6503 } },
                address_components: [{ long_name: 'Japan', short_name: 'JP', types: ['country'] }],
              },
            ],
          }),
      }),
    );
    const { authHeader } = await createAuthedUser();

    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Tokyo Person',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'approximate',
        birthTime: '10:00',
        location: { placeId: 'place-tokyo' },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.location).toMatchObject({
      timezone: 'Asia/Tokyo',
      placeId: 'place-tokyo',
    });
  });
});

describe('birth profile ownership and lifecycle', () => {
  async function createProfile(authHeader: string) {
    const res = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Owner Profile',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'exact',
        birthTime: '08:30',
        location: manualLocation(),
      });
    return res.body.data;
  }

  it("lists only the requesting user's own profiles", async () => {
    const owner = await createAuthedUser();
    await createProfile(owner.authHeader);
    await createProfile(owner.authHeader);

    const other = await createAuthedUser();
    await createProfile(other.authHeader);

    const res = await request(app)
      .get('/api/v1/birth-profiles')
      .set('Authorization', owner.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
  });

  it("returns 404 (not 403) when fetching another user's birth profile", async () => {
    const owner = await createAuthedUser();
    const profile = await createProfile(owner.authHeader);
    const stranger = await createAuthedUser();

    const res = await request(app)
      .get(`/api/v1/birth-profiles/${String(profile.id)}`)
      .set('Authorization', stranger.authHeader);

    expect(res.status).toBe(404);
  });

  it('returns 404 when updating or deleting a birth profile owned by someone else', async () => {
    const owner = await createAuthedUser();
    const profile = await createProfile(owner.authHeader);
    const stranger = await createAuthedUser();

    const updateRes = await request(app)
      .patch(`/api/v1/birth-profiles/${String(profile.id)}`)
      .set('Authorization', stranger.authHeader)
      .send({ name: 'Hijacked' });
    expect(updateRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/birth-profiles/${String(profile.id)}`)
      .set('Authorization', stranger.authHeader);
    expect(deleteRes.status).toBe(404);
  });

  it('switching confidence to "unknown" via update clears the stored birth time', async () => {
    const owner = await createAuthedUser();
    const profile = await createProfile(owner.authHeader);

    const res = await request(app)
      .patch(`/api/v1/birth-profiles/${String(profile.id)}`)
      .set('Authorization', owner.authHeader)
      .send({ timeConfidence: 'unknown' });

    expect(res.status).toBe(200);
    expect(res.body.data.timeConfidence).toBe('unknown');
    expect(res.body.data.birthTime).toBeNull();
  });

  it('rejects switching confidence to "exact" without also supplying a birth time when none is on file', async () => {
    const owner = await createAuthedUser();
    const unknownProfileRes = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', owner.authHeader)
      .send({
        name: 'No Time Yet',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'unknown',
        location: manualLocation(),
      });

    const res = await request(app)
      .patch(`/api/v1/birth-profiles/${String(unknownProfileRes.body.data.id)}`)
      .set('Authorization', owner.authHeader)
      .send({ timeConfidence: 'exact' });

    expect(res.status).toBe(400);
  });

  it('deletes a profile', async () => {
    const owner = await createAuthedUser();
    const profile = await createProfile(owner.authHeader);

    const deleteRes = await request(app)
      .delete(`/api/v1/birth-profiles/${String(profile.id)}`)
      .set('Authorization', owner.authHeader);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/birth-profiles/${String(profile.id)}`)
      .set('Authorization', owner.authHeader);
    expect(getRes.status).toBe(404);
  });
});
