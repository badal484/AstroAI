import { NotificationEventType } from '@astroai/shared-types';
import { eventBus } from '../../shared/eventBus';
import { logger } from '../../shared/logger';
import { campaignService } from './campaign.service';
import { notificationService } from './notification.service';

export function registerNotificationListeners(): void {
  // 1. User Registration Event
  eventBus.on('user.registered', (payload) => {
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.USER_REGISTRATION,
        templateCode: 'WELCOME_USER',
        variables: { name: payload.name || 'Seeker' },
        deduplicationKey: `reg_${payload.userId}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send welcome notification'));
  });

  // 2. Birth Profile Completed Event
  eventBus.on('birthProfile.completed', (payload) => {
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.BIRTH_PROFILE_COMPLETION,
        templateCode: 'BIRTH_PROFILE_COMPLETE',
        variables: { name: payload.name },
        deduplicationKey: `profile_${payload.birthProfileId}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send profile completion notification'));
  });

  // 3. First Chat Message Event
  eventBus.on('chat.firstMessage', (payload) => {
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.FIRST_CHAT,
        templateCode: 'FIRST_CHAT_FOLLOWUP',
        variables: { title: payload.title || 'Your Consultation' },
        deduplicationKey: `first_chat_${payload.userId}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send first chat notification'));
  });

  // 4. Low Wallet Balance Event
  eventBus.on('wallet.lowBalance', (payload) => {
    const today = new Date().toISOString().slice(0, 10);
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.LOW_WALLET_BALANCE,
        templateCode: 'LOW_WALLET_BALANCE_ALERT',
        variables: { availableBalance: payload.availableBalance },
        deduplicationKey: `low_bal_${payload.userId}_${today}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send low balance notification'));
  });

  // 5. Report Ready Event
  eventBus.on('report.ready', (payload) => {
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.REPORT_READY,
        templateCode: 'REPORT_GENERATED',
        variables: {
          reportId: payload.reportId,
          reportTitle: payload.reportType.replace(/_/g, ' ').toUpperCase(),
        },
        deduplicationKey: `report_${payload.reportId}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send report ready notification'));
  });

  // 6. Daily Horoscope Ready Event
  eventBus.on('horoscope.ready', (payload) => {
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.HOROSCOPE_READY,
        templateCode: 'DAILY_HOROSCOPE_ALERT',
        variables: {
          rashi: payload.rashi,
          summary: payload.summary || 'Planetary Gochara alignments for today.',
        },
        deduplicationKey: `horo_${payload.userId}_${payload.date}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send horoscope notification'));
  });

  // 7. Payment Purchased Event
  eventBus.on('payment.purchased', (payload) => {
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.PURCHASE,
        templateCode: 'PAYMENT_RECEIPT',
        variables: {
          orderId: payload.orderId,
          amount: payload.amount,
          credits: payload.credits,
          currency: payload.currency,
        },
        deduplicationKey: `pay_${payload.orderId}`,
        forceSend: true,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send payment receipt notification'));
  });

  // 8. Inactivity Nudge Event
  eventBus.on('user.inactivity', (payload) => {
    const week = Math.floor(Date.now() / (7 * 86400000));
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.INACTIVITY,
        templateCode: 'INACTIVITY_NUDGE',
        variables: { inactiveDays: payload.inactiveDays },
        deduplicationKey: `inact_${payload.userId}_${week}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send inactivity notification'));
  });

  // 9. Birthday Blessing Event
  eventBus.on('user.birthday', (payload) => {
    const year = new Date().getFullYear();
    notificationService
      .send({
        userId: payload.userId,
        eventType: NotificationEventType.BIRTHDAY,
        templateCode: 'BIRTHDAY_GREETING',
        variables: { name: payload.name },
        deduplicationKey: `bday_${payload.userId}_${year}`,
      })
      .catch((err) => logger.error({ err, userId: payload.userId }, 'Failed to send birthday notification'));
  });

  // 10. Campaign Triggered Event
  eventBus.on('campaign.triggered', (payload) => {
    campaignService
      .executeCampaign(payload.campaignId)
      .catch((err) => logger.error({ err, campaignId: payload.campaignId }, 'Failed to execute campaign'));
  });

  // 11. Referral Reward Event
  eventBus.on('referral.reward', (payload) => {
    notificationService
      .send({
        userId: payload.referrerId,
        eventType: NotificationEventType.REFERRAL_REWARD,
        templateCode: 'REFERRAL_CREDITS_EARNED',
        variables: { creditsAwarded: payload.creditsAwarded },
        deduplicationKey: `ref_${payload.referrerId}_${payload.userId}`,
      })
      .catch((err) => logger.error({ err, userId: payload.referrerId }, 'Failed to send referral notification'));
  });

  logger.info('Notification event listeners registered for all 11 domain events');
}
