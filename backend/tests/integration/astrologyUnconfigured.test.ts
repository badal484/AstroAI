import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { userService } from '../../src/modules/users';
import { signAccessToken } from '../../src/shared/tokens';

/**
 * No mocking here — this exercises the REAL default wiring end-to-end:
 * `ASTROLOGY_ENGINE_PROVIDER` defaults to 'none', so the registry resolves
 * to `unconfiguredEngine`, and a request must get a clear 503 rather than
 * fabricated chart data (CLAUDE.md §51).
 */
const app = createApp();

describe('astrology chart with no engine configured', () => {
  it('returns 503 ASTROLOGY_ENGINE_UNAVAILABLE instead of any chart data', async () => {
    const user = await userService.createUser({
      email: `${crypto.randomUUID()}@example.com`,
      name: 'Test User',
      avatarUrl: null,
    });
    const { token } = signAccessToken({ sub: user.id, role: 'user' }, env.JWT_ACCESS_SECRET, 900);
    const authHeader = `Bearer ${token}`;

    const profileRes = await request(app)
      .post('/api/v1/birth-profiles')
      .set('Authorization', authHeader)
      .send({
        name: 'Chart Subject',
        dateOfBirth: '1990-05-14',
        timeConfidence: 'exact',
        birthTime: '08:30',
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

    const chartRes = await request(app)
      .get(`/api/v1/astrology/chart/${String(profileRes.body.data.id)}`)
      .set('Authorization', authHeader);

    expect(chartRes.status).toBe(503);
    expect(chartRes.body.error.code).toBe('ASTROLOGY_ENGINE_UNAVAILABLE');
    expect(chartRes.body.data).toBeUndefined();
  });
});
