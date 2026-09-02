import argon2 from 'argon2';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AdminRole } from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';

const app = createApp();

async function createAdmin(role: AdminRole, email: string, password = 'correct-horse-battery') {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Test Admin', role });
  return { email, password };
}

function findRawCookie(response: request.Response, name: string): string | undefined {
  const raw = response.headers['set-cookie'] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith(`${name}=`));
}

/** The `name=value` pair only, suitable for sending back in a `Cookie` header. */
function extractCookie(response: request.Response, name: string): string | undefined {
  return findRawCookie(response, name)?.split(';')[0];
}

async function login(email: string, password: string) {
  const response = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const accessCookie = extractCookie(response, 'admin_access_token');
  const refreshCookie = extractCookie(response, 'admin_refresh_token');
  return { response, accessCookie, refreshCookie };
}

describe('POST /api/v1/admin/auth/login', () => {
  it('logs in with correct credentials and sets httpOnly session cookies', async () => {
    const { email, password } = await createAdmin(AdminRole.SUPER_ADMIN, 'super@astroai.test');
    const { response, accessCookie, refreshCookie } = await login(email, password);

    expect(response.status).toBe(200);
    expect(response.body.data.admin.email).toBe(email);
    // Tokens never appear in the body — only in httpOnly cookies.
    expect(JSON.stringify(response.body)).not.toContain('accessToken');
    expect(accessCookie).toBeTypeOf('string');
    expect(refreshCookie).toBeTypeOf('string');
    expect(findRawCookie(response, 'admin_access_token')).toContain('HttpOnly');
    expect(findRawCookie(response, 'admin_refresh_token')).toContain('HttpOnly');
  });

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'nobody@astroai.test', password: 'whatever12345' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an incorrect password', async () => {
    const { email } = await createAdmin(AdminRole.SUPER_ADMIN, 'super2@astroai.test');
    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email, password: 'the-wrong-password' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/v1/admin/auth/me', () => {
  it('rejects requests with no admin session', async () => {
    const response = await request(app).get('/api/v1/admin/auth/me');
    expect(response.status).toBe(401);
  });

  it('returns the admin profile with permissions for a valid session', async () => {
    const { email, password } = await createAdmin(AdminRole.OPERATIONS, 'ops@astroai.test');
    const { accessCookie } = await login(email, password);

    const response = await request(app).get('/api/v1/admin/auth/me').set('Cookie', accessCookie!);
    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe('operations');
    expect(response.body.data.permissions).toContain('users:read');
  });
});

describe('admin RBAC on /api/v1/admin/users', () => {
  it('allows a support admin to list users (users:read)', async () => {
    const { email, password } = await createAdmin(AdminRole.SUPPORT, 'support@astroai.test');
    const { accessCookie } = await login(email, password);

    const response = await request(app).get('/api/v1/admin/users').set('Cookie', accessCookie!);
    expect(response.status).toBe(200);
  });

  it('forbids a support admin from suspending a user (missing users:manage)', async () => {
    const { email, password } = await createAdmin(AdminRole.SUPPORT, 'support2@astroai.test');
    const { accessCookie } = await login(email, password);

    const response = await request(app)
      .post('/api/v1/admin/users/000000000000000000000000/suspend')
      .set('Cookie', accessCookie!);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('allows super_admin to suspend and reactivate a user', async () => {
    const { email, password } = await createAdmin(AdminRole.SUPER_ADMIN, 'super3@astroai.test');
    const { accessCookie } = await login(email, password);

    const { UserModel } = await import('../../src/modules/users/user.model');
    const user = await UserModel.create({ email: 'target@astroai.test' });

    const suspend = await request(app)
      .post(`/api/v1/admin/users/${user._id.toString()}/suspend`)
      .set('Cookie', accessCookie!);
    expect(suspend.status).toBe(200);
    expect(suspend.body.data.status).toBe('suspended');

    const reactivate = await request(app)
      .post(`/api/v1/admin/users/${user._id.toString()}/reactivate`)
      .set('Cookie', accessCookie!);
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.data.status).toBe('active');
  });
});

describe('admin session lifecycle', () => {
  it('refreshes via the refresh cookie and rotates it', async () => {
    const { email, password } = await createAdmin(AdminRole.SUPER_ADMIN, 'super4@astroai.test');
    const { refreshCookie } = await login(email, password);

    const response = await request(app)
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', refreshCookie!);
    expect(response.status).toBe(200);
    const newRefreshCookie = extractCookie(response, 'admin_refresh_token');
    expect(newRefreshCookie).not.toBe(refreshCookie);
  });

  it('logout revokes the session so the old refresh cookie stops working', async () => {
    const { email, password } = await createAdmin(AdminRole.SUPER_ADMIN, 'super5@astroai.test');
    const { refreshCookie } = await login(email, password);

    await request(app).post('/api/v1/admin/auth/logout').set('Cookie', refreshCookie!);

    const response = await request(app)
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', refreshCookie!);
    expect(response.status).toBe(401);
  });
});
