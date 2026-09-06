import argon2 from 'argon2';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AdminRole,
  AudienceSegment,
  CampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from '@astroai/shared-types';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { adminUserRepository } from '../../src/modules/admin/adminUser.repository';
import { notificationService } from '../../src/modules/notifications/notification.service';
import { userService } from '../../src/modules/users';
import { eventBus } from '../../src/shared/eventBus';
import { signAccessToken } from '../../src/shared/tokens';

const app = createApp();

async function createAdminAndLogin(role: AdminRole, email: string) {
  const password = 'secure-password-123';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await adminUserRepository.create({ email, passwordHash, name: 'Notification Admin', role });

  const loginRes = await request(app).post('/api/v1/admin/auth/login').send({ email, password });
  const raw = loginRes.headers['set-cookie'] as unknown as string[];
  const accessCookie = raw?.find((c) => c.startsWith('admin_access_token='))?.split(';')[0];
  return { email, accessCookie };
}

describe('Notification Platform Integration Tests', () => {
  let userToken: string;
  let adminCookie: string;
  let userId: string;

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    const user = await userService.createUser({
      email: 'seeker@astroai.test',
      name: 'Arjun Verma',
      avatarUrl: null,
    });
    userId = user._id.toString();
    const { token } = signAccessToken(
      { sub: userId, role: 'user' },
      env.JWT_ACCESS_SECRET,
      900,
    );
    userToken = token;

    const admin = await createAdminAndLogin(
      AdminRole.SUPER_ADMIN,
      'admin.notify@astroai.test',
    );
    adminCookie = admin.accessCookie!;

    await notificationService.seedDefaultTemplates();
    await notificationService.updateUserPreferences(userId, {
      quietHours: { enabled: false, startHour: 22, startMinute: 0, endHour: 8, endMinute: 0 },
    });
  });

  describe('User Preferences & Push Token Management', () => {
    it('retrieves default notification preferences for user', async () => {
      const freshUser = await userService.createUser({
        email: 'fresh@astroai.test',
        name: 'Fresh Seeker',
        avatarUrl: null,
      });
      const { token: freshToken } = signAccessToken(
        { sub: freshUser._id.toString(), role: 'user' },
        env.JWT_ACCESS_SECRET,
        900,
      );

      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channels.push).toBe(true);
      expect(res.body.data.channels.email).toBe(true);
      expect(res.body.data.quietHours.enabled).toBe(true);
      expect(res.body.data.optedOut).toBe(false);
    });

    it('updates quiet hours and category preferences', async () => {
      const res = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quietHours: {
            enabled: true,
            startHour: 23,
            startMinute: 0,
            endHour: 7,
            endMinute: 30,
          },
          categories: {
            marketing: false,
          },
          language: 'hi',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quietHours.startHour).toBe(23);
      expect(res.body.data.quietHours.endMinute).toBe(30);
      expect(res.body.data.categories.marketing).toBe(false);
      expect(res.body.data.language).toBe('hi');
    });

    it('registers user mobile push token', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/push-token')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'fcm_token_device_abc987',
          deviceType: 'android',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pushTokensCount).toBe(1);
    });
  });

  describe('Event-Driven Notification Flows & Anti-Spam Protections', () => {
    it('dispatches welcome notification upon user.registered event', async () => {
      eventBus.emit('user.registered', {
        userId,
        email: 'seeker@astroai.test',
        name: 'Arjun Verma',
      });

      // Wait a tick for async event handler
      await new Promise((resolve) => setTimeout(resolve, 100));

      const inboxRes = await request(app)
        .get('/api/v1/notifications/inbox')
        .set('Authorization', `Bearer ${userToken}`);

      expect(inboxRes.status).toBe(200);
      expect(inboxRes.body.data.items.length).toBeGreaterThanOrEqual(1);
      const welcome = inboxRes.body.data.items.find(
        (i: any) => i.eventType === NotificationEventType.USER_REGISTRATION,
      );
      expect(welcome).toBeDefined();
      expect(welcome.title).toContain('Welcome to AstroAI, Arjun Verma!');
    });

    it('dispatches low wallet balance alert upon wallet.lowBalance event', async () => {
      eventBus.emit('wallet.lowBalance', {
        userId,
        availableBalance: 2,
        threshold: 5,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const inboxRes = await request(app)
        .get('/api/v1/notifications/inbox')
        .set('Authorization', `Bearer ${userToken}`);

      const alert = inboxRes.body.data.items.find(
        (i: any) => i.eventType === NotificationEventType.LOW_WALLET_BALANCE,
      );
      expect(alert).toBeDefined();
      expect(alert.title).toContain('Low Credits Alert');
      expect(alert.body).toContain('2 credits remaining');
    });

    it('dispatches report ready notification upon report.ready event', async () => {
      eventBus.emit('report.ready', {
        userId,
        reportId: 'rep_12345678',
        reportType: 'full_kundli',
        pdfUrl: '/api/v1/reports/rep_12345678/pdf',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const inboxRes = await request(app)
        .get('/api/v1/notifications/inbox')
        .set('Authorization', `Bearer ${userToken}`);

      const reportNotif = inboxRes.body.data.items.find(
        (i: any) => i.eventType === NotificationEventType.REPORT_READY,
      );
      expect(reportNotif).toBeDefined();
      expect(reportNotif.title).toContain('FULL KUNDLI is Ready!');
    });

    it('prevents duplicate notification sends for the same idempotency key', async () => {
      const send1 = await notificationService.send({
        userId,
        eventType: NotificationEventType.INACTIVITY,
        templateCode: 'INACTIVITY_NUDGE',
        deduplicationKey: `test_dedup_${userId}`,
      });
      expect(send1.deliveredCount).toBeGreaterThanOrEqual(1);

      const send2 = await notificationService.send({
        userId,
        eventType: NotificationEventType.INACTIVITY,
        templateCode: 'INACTIVITY_NUDGE',
        deduplicationKey: `test_dedup_${userId}`,
      });
      expect(send2.suppressedCount).toBeGreaterThanOrEqual(1);
      expect(send2.logs[0]!.status).toBe(NotificationDeliveryStatus.SUPPRESSED_DUPLICATE);
    });
  });

  describe('Admin Campaign & Template Management', () => {
    it('creates, inspects, and updates notification templates', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/notifications/templates')
        .set('Cookie', adminCookie)
        .send({
          templateCode: 'SPECIAL_HOLIDAY_PROMO',
          name: 'Special Holiday Promo',
          eventType: NotificationEventType.PROMOTIONAL_CAMPAIGN,
          category: NotificationCategory.MARKETING,
          channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
          locales: {
            en: {
              title: 'Diwali Cosmic Blessings 🪔',
              body: 'Enjoy 50% extra credits on all Vedic bundles.',
              actionUrl: '/wallet',
            },
          },
          variables: ['discount'],
          isActive: true,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.templateCode).toBe('SPECIAL_HOLIDAY_PROMO');

      const listRes = await request(app)
        .get('/api/v1/admin/notifications/templates')
        .set('Cookie', adminCookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('creates, schedules, and executes an audience campaign', async () => {
      const campRes = await request(app)
        .post('/api/v1/admin/notifications/campaigns')
        .set('Cookie', adminCookie)
        .send({
          name: 'All Users Transit Announcement',
          templateCode: 'INACTIVITY_NUDGE',
          audienceSegment: AudienceSegment.ALL_USERS,
          channels: [NotificationChannel.PUSH],
        });

      expect(campRes.status).toBe(201);
      const campId = campRes.body.data.id;

      const execRes = await request(app)
        .post(`/api/v1/admin/notifications/campaigns/${campId}/execute`)
        .set('Cookie', adminCookie);

      expect(execRes.status).toBe(200);
      expect(execRes.body.data.status).toBe(CampaignStatus.COMPLETED);
      expect(execRes.body.data.stats.totalTargeted).toBeGreaterThanOrEqual(1);
      expect(execRes.body.data.stats.sent).toBeGreaterThanOrEqual(1);
    });

    it('fetches platform notification delivery statistics and logs', async () => {
      const statsRes = await request(app)
        .get('/api/v1/admin/notifications/stats')
        .set('Cookie', adminCookie);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data).toHaveProperty('totalSent');
      expect(statsRes.body.data).toHaveProperty('byChannel');

      const logsRes = await request(app)
        .get('/api/v1/admin/notifications/logs')
        .set('Cookie', adminCookie);

      expect(logsRes.status).toBe(200);
      expect(Array.isArray(logsRes.body.data.items)).toBe(true);
    });
  });
});
