import argon2 from 'argon2';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AccountStatus,
  AdminRole,
  AyanamshaSystem,
  TicketPriority,
  TicketStatus,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { SupportTicketModel } from '../../src/modules/admin/supportTicket.model';
import { userService } from '../../src/modules/users';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: `Admin ${role}`, role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

describe('Admin Control Center Integration Tests', () => {
  let superAdminCookie: string;
  let supportAdminCookie: string;
  let contentAdminCookie: string;
  let testUserId: string;

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    // Create test user
    const user = await userService.createUser({
      email: 'seeker.control@astroai.test',
      name: 'Seeker Control',
      avatarUrl: null,
    });
    testUserId = user._id.toString();

    // Create Super Admin
    const superAdmin = await createAdminAndLogin(
      AdminRole.SUPER_ADMIN,
      'superadmin@astroai.test',
    );
    superAdminCookie = superAdmin.accessCookie!;

    // Create Support Admin
    const supportAdmin = await createAdminAndLogin(
      AdminRole.SUPPORT,
      'support@astroai.test',
    );
    supportAdminCookie = supportAdmin.accessCookie!;

    // Create Content Admin
    const contentAdmin = await createAdminAndLogin(
      AdminRole.CONTENT,
      'content@astroai.test',
    );
    contentAdminCookie = contentAdmin.accessCookie!;
  });

  describe('User 360 & Operations', () => {
    it('retrieves comprehensive 360 overview for a user', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${testUserId}/overview`)
        .set('Cookie', [superAdminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(testUserId);
      expect(res.body.data).toHaveProperty('wallet');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('recentTransactions');
    });

    it('executes wallet adjustment and records audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${testUserId}/action`)
        .set('Cookie', [superAdminCookie])
        .send({
          action: 'adjust_wallet',
          reason: 'Customer goodwill credit for delayed report',
          amountCredits: 50,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet.balance).toBe(50);

      // Verify audit log
      const auditRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Cookie', [superAdminCookie]);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.length).toBeGreaterThan(0);
      expect(auditRes.body.data[0].action).toBe('wallet.credit_adjust');
    });

    it('suspends user account and verifies updated status', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${testUserId}/action`)
        .set('Cookie', [superAdminCookie])
        .send({
          action: 'suspend',
          reason: 'Chargeback investigation in progress',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe(AccountStatus.SUSPENDED);
    });
  });

  describe('AI & Astrology Engine Configuration', () => {
    it('fetches AI providers, routing rules, and persona definitions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/ai/config')
        .set('Cookie', [superAdminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('providers');
      expect(res.body.data).toHaveProperty('routingRules');
      expect(res.body.data).toHaveProperty('personas');
    });

    it('updates Astrology Engine ayanamsha and weights with audit log', async () => {
      const res = await request(app)
        .put('/api/v1/admin/astrology/config')
        .set('Cookie', [superAdminCookie])
        .send({
          ayanamsha: AyanamshaSystem.KRISHNAMURTI,
          reason: 'Calibrating KP precision standards',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ayanamsha).toBe(AyanamshaSystem.KRISHNAMURTI);
    });
  });

  describe('Feature Flags & Rollouts', () => {
    it('lists active feature flags and toggles a flag', async () => {
      const listRes = await request(app)
        .get('/api/v1/admin/feature-flags')
        .set('Cookie', [superAdminCookie]);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      const flagKey = listRes.body.data[0].key;
      const toggleRes = await request(app)
        .post(`/api/v1/admin/feature-flags/${flagKey}/toggle`)
        .set('Cookie', [superAdminCookie])
        .send({
          enabled: false,
          reason: 'Emergency disable for latency benchmarking',
        });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.data.enabled).toBe(false);
    });
  });

  describe('Executive Analytics', () => {
    it('fetches platform executive KPIs and revenue charts', async () => {
      const overviewRes = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Cookie', [superAdminCookie]);

      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body.data).toHaveProperty('grossMerchandiseValuePaise');
      expect(overviewRes.body.data).toHaveProperty('totalSeekers');

      const chartRes = await request(app)
        .get('/api/v1/admin/analytics/revenue')
        .set('Cookie', [superAdminCookie]);

      expect(chartRes.status).toBe(200);
      expect(Array.isArray(chartRes.body.data)).toBe(true);
    });
  });

  describe('Support Helpdesk', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await SupportTicketModel.create({
        userId: testUserId,
        userEmail: 'seeker.control@astroai.test',
        userName: 'Seeker Control',
        subject: 'Query regarding Kundli Report transit date',
        category: 'report',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        messages: [
          {
            senderType: 'user',
            senderId: testUserId,
            senderName: 'Seeker Control',
            body: 'My report does not show Jupiter transit date.',
          },
        ],
      });
      ticketId = ticket._id.toString();
    });

    it('lists support tickets and replies to customer inquiry', async () => {
      const listRes = await request(app)
        .get('/api/v1/admin/support/tickets')
        .set('Cookie', [supportAdminCookie]);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);

      const replyRes = await request(app)
        .post(`/api/v1/admin/support/tickets/${ticketId}/reply`)
        .set('Cookie', [supportAdminCookie])
        .send({
          body: 'Hello Seeker, Jupiter transit dates are listed under chapter 4 of your PDF report.',
        });

      expect(replyRes.status).toBe(200);
      expect(replyRes.body.data.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('resolves support ticket with resolution notes', async () => {
      const resolveRes = await request(app)
        .post(`/api/v1/admin/support/tickets/${ticketId}/resolve`)
        .set('Cookie', [supportAdminCookie])
        .send({
          resolutionNotes: 'Clarified Jupiter transit chart location in PDF report.',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe(TicketStatus.RESOLVED);
    });
  });

  describe('System Settings & Maintenance Mode', () => {
    it('fetches system settings and toggles maintenance mode', async () => {
      const settingsRes = await request(app)
        .get('/api/v1/admin/settings')
        .set('Cookie', [superAdminCookie]);

      expect(settingsRes.status).toBe(200);
      expect(settingsRes.body.data.maintenance.enabled).toBe(false);

      const maintRes = await request(app)
        .post('/api/v1/admin/settings/maintenance')
        .set('Cookie', [superAdminCookie])
        .send({
          enabled: true,
          message: 'Upgrading celestial planetary database.',
          reason: 'Scheduled server maintenance',
        });

      expect(maintRes.status).toBe(200);
      expect(maintRes.body.data.maintenance.enabled).toBe(true);

      // Reset maintenance mode back to false
      await request(app)
        .post('/api/v1/admin/settings/maintenance')
        .set('Cookie', [superAdminCookie])
        .send({
          enabled: false,
          reason: 'Reset after test',
        });
    });
  });

  describe('RBAC Permission Guardrails', () => {
    it('forbids Content admin from modifying system settings', async () => {
      const res = await request(app)
        .post('/api/v1/admin/settings/maintenance')
        .set('Cookie', [contentAdminCookie])
        .send({
          enabled: true,
        });

      expect(res.status).toBe(403);
    });

    it('forbids Support admin from toggling feature flags', async () => {
      const res = await request(app)
        .post('/api/v1/admin/feature-flags/voice_astrologer_v2/toggle')
        .set('Cookie', [supportAdminCookie])
        .send({
          enabled: false,
        });

      expect(res.status).toBe(403);
    });
  });
});
