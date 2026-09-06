import { describe, expect, it } from 'vitest';
import { pushNotificationAdapter } from '../../../src/modules/notifications/channels/pushAdapter';
import { emailNotificationAdapter } from '../../../src/modules/notifications/channels/emailAdapter';

describe('Channel Adapters', () => {
  describe('PushNotificationAdapter', () => {
    it('successfully delivers push notification to recipient device token', async () => {
      const res = await pushNotificationAdapter.send({
        recipient: 'fcm_device_token_xyz123',
        title: 'Daily Horoscope 🪐',
        body: 'Planetary alignments favor career growth today.',
        actionUrl: '/horoscope',
        data: { rashi: 'Mesha' },
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toMatch(/^push_msg_/);
    });

    it('rejects push dispatch when recipient token is missing', async () => {
      const res = await pushNotificationAdapter.send({
        recipient: '',
        title: 'Alert',
        body: 'Missing recipient',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('No push token');
    });
  });

  describe('EmailNotificationAdapter', () => {
    it('successfully sends email notification with HTML wrapper', async () => {
      const res = await emailNotificationAdapter.send({
        recipient: 'seeker@astroai.test',
        title: 'Astrology Report Ready',
        body: 'Your Life Kundli report is ready for download.',
        actionUrl: '/reports/rep_101',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toMatch(/^email_msg_/);
    });

    it('rejects email dispatch when recipient address is invalid', async () => {
      const res = await emailNotificationAdapter.send({
        recipient: 'invalid_email_format',
        title: 'Invoice',
        body: 'Here is your receipt',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid email');
    });
  });
});
