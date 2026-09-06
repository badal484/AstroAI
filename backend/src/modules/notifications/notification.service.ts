import {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  type NotificationLogDTO,
  type NotificationStatsDTO,
  type RegisterPushTokenInput,
  type UpdateNotificationPreferenceInput,
  type UserNotificationPreferenceDTO,
} from '@astroai/shared-types';
import { userService } from '../users/user.service';
import { emailNotificationAdapter } from './channels/emailAdapter';
import { pushNotificationAdapter } from './channels/pushAdapter';
import { DEFAULT_NOTIFICATION_TEMPLATES } from './defaultTemplates';
import { policyEngine } from './policies/policyEngine';
import { templateEngine } from './policies/templateEngine';
import { notificationLogRepository } from './repositories/notificationLog.repository';
import { templateRepository } from './repositories/template.repository';
import { userPreferenceRepository } from './repositories/userPreference.repository';

export interface SendNotificationOptions {
  userId: string;
  eventType: NotificationEventType;
  templateCode?: string;
  campaignId?: string;
  variables?: Record<string, any>;
  customContent?: {
    title: string;
    body: string;
    actionUrl?: string;
  };
  channelOverride?: NotificationChannel;
  deduplicationKey?: string;
  deduplicationWindowMs?: number;
  forceSend?: boolean;
}

export const notificationService = {
  /**
   * Seeds default templates into the database if not present.
   */
  async seedDefaultTemplates(): Promise<void> {
    for (const tpl of DEFAULT_NOTIFICATION_TEMPLATES) {
      await templateRepository.upsertByCode(tpl);
    }
  },

  /**
   * Dispatches a notification through policy checks, template interpolation, and channel adapters.
   */
  async send(options: SendNotificationOptions): Promise<{
    logs: NotificationLogDTO[];
    deliveredCount: number;
    suppressedCount: number;
    deferredCount: number;
  }> {
    const {
      userId,
      eventType,
      templateCode,
      campaignId,
      variables = {},
      customContent,
      channelOverride,
      deduplicationKey,
      deduplicationWindowMs,
      forceSend,
    } = options;

    const [preference, userDoc] = await Promise.all([
      userPreferenceRepository.getOrCreate(userId),
      userService.getById(userId).catch(() => null),
    ]);

    // Template resolution
    let template = templateCode
      ? await templateRepository.findByCode(templateCode)
      : await templateRepository.findByEventType(eventType);

    if (!template && !customContent) {
      // Auto-fallback to default template matching event type
      const defaultMatch = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.eventType === eventType);
      if (defaultMatch) {
        template = await templateRepository.upsertByCode(defaultMatch);
      }
    }

    const category = template?.category || NotificationCategory.LIFECYCLE;
    const targetChannels = channelOverride
      ? [channelOverride]
      : template?.channels || [NotificationChannel.PUSH];

    const logs: NotificationLogDTO[] = [];
    let deliveredCount = 0;
    let suppressedCount = 0;
    let deferredCount = 0;

    for (const channel of targetChannels) {
      // 1. Evaluate Policies (Quiet hours, opt-outs, frequency caps, duplicate checks)
      const policyResult = await policyEngine.evaluate({
        preference,
        category,
        channel,
        deduplicationKey: deduplicationKey ? `${deduplicationKey}:${channel}` : undefined,
        deduplicationWindowMs,
        forceSend,
      });

      // 2. Resolve Recipient
      let recipient: string | null = null;
      if (channel === NotificationChannel.PUSH) {
        recipient =
          preference.pushTokens && preference.pushTokens.length > 0
            ? preference.pushTokens[preference.pushTokens.length - 1]?.token || userId
            : userId;
      } else if (channel === NotificationChannel.EMAIL) {
        recipient = userDoc?.email || null;
      } else {
        recipient = userId;
      }

      // If no valid recipient email, mark suppressed
      if (channel === NotificationChannel.EMAIL && (!recipient || !recipient.includes('@'))) {
        continue;
      }

      // 3. Resolve Content
      let title = '';
      let body = '';
      let actionUrl: string | undefined;

      if (customContent) {
        title = templateEngine.interpolate(customContent.title, variables);
        body = templateEngine.interpolate(customContent.body, variables);
        actionUrl = customContent.actionUrl;
      } else if (template) {
        const resolved = templateEngine.resolveLocaleContent(
          template.locales,
          preference.language,
          variables,
        );
        title = resolved.title;
        body = resolved.body;
        actionUrl = resolved.actionUrl;
      } else {
        title = 'AstroAI Notification';
        body = 'You have a new update in AstroAI.';
      }

      // 4. Handle Suppression
      if (policyResult.action === 'SUPPRESS') {
        const logDoc = await notificationLogRepository.create({
          userId,
          channel,
          category,
          eventType,
          templateCode: template?.templateCode,
          campaignId,
          recipient: recipient || userId,
          title,
          body,
          data: variables,
          status: policyResult.status,
          deduplicationKey: deduplicationKey ? `${deduplicationKey}:${channel}` : undefined,
          failedReason: policyResult.reason,
        });
        logs.push(logDoc.toDTO());
        suppressedCount++;
        continue;
      }

      // 5. Handle Deferral (Quiet Hours)
      if (policyResult.action === 'DEFER') {
        const logDoc = await notificationLogRepository.create({
          userId,
          channel,
          category,
          eventType,
          templateCode: template?.templateCode,
          campaignId,
          recipient: recipient || userId,
          title,
          body,
          data: { ...variables, actionUrl },
          status: policyResult.status,
          deduplicationKey: deduplicationKey ? `${deduplicationKey}:${channel}` : undefined,
          scheduledFor: policyResult.deferUntil,
          failedReason: policyResult.reason,
        });
        logs.push(logDoc.toDTO());
        deferredCount++;
        continue;
      }

      // 6. Immediate Delivery
      const logDoc = await notificationLogRepository.create({
        userId,
        channel,
        category,
        eventType,
        templateCode: template?.templateCode,
        campaignId,
        recipient: recipient || userId,
        title,
        body,
        data: { ...variables, actionUrl },
        status: NotificationDeliveryStatus.SENDING,
        deduplicationKey: deduplicationKey ? `${deduplicationKey}:${channel}` : undefined,
        sentAt: new Date(),
      });

      const adapter =
        channel === NotificationChannel.PUSH
          ? pushNotificationAdapter
          : channel === NotificationChannel.EMAIL
          ? emailNotificationAdapter
          : pushNotificationAdapter;

      const sendResult = await adapter.send({
        recipient: recipient || userId,
        title,
        body,
        actionUrl,
        data: variables,
      });

      if (sendResult.success) {
        const updated = await notificationLogRepository.updateStatus(
          logDoc._id.toString(),
          NotificationDeliveryStatus.DELIVERED,
          { deliveredAt: new Date() },
        );
        logs.push(updated ? updated.toDTO() : logDoc.toDTO());
        deliveredCount++;
      } else {
        const updated = await notificationLogRepository.updateStatus(
          logDoc._id.toString(),
          NotificationDeliveryStatus.FAILED,
          { failedReason: sendResult.error, retryCount: logDoc.retryCount + 1 },
        );
        logs.push(updated ? updated.toDTO() : logDoc.toDTO());
      }
    }

    return {
      logs,
      deliveredCount,
      suppressedCount,
      deferredCount,
    };
  },

  /**
   * Scans and processes deferred notifications whose quiet hours have elapsed.
   */
  async processDeferredQueue(): Promise<number> {
    const now = new Date();
    const deferredItems = await notificationLogRepository.listAll({
      status: NotificationDeliveryStatus.DEFERRED_QUIET_HOURS,
      limit: 100,
    });

    let processedCount = 0;
    for (const item of deferredItems.items) {
      if (item.scheduledFor && item.scheduledFor <= now) {
        const adapter =
          item.channel === NotificationChannel.PUSH
            ? pushNotificationAdapter
            : item.channel === NotificationChannel.EMAIL
            ? emailNotificationAdapter
            : pushNotificationAdapter;

        const sendResult = await adapter.send({
          recipient: item.recipient,
          title: item.title,
          body: item.body,
          actionUrl: item.data?.actionUrl,
          data: item.data,
        });

        if (sendResult.success) {
          await notificationLogRepository.updateStatus(
            item._id.toString(),
            NotificationDeliveryStatus.DELIVERED,
            { deliveredAt: new Date(), sentAt: new Date() },
          );
          processedCount++;
        } else {
          await notificationLogRepository.updateStatus(
            item._id.toString(),
            NotificationDeliveryStatus.FAILED,
            { failedReason: sendResult.error, retryCount: item.retryCount + 1 },
          );
        }
      }
    }

    return processedCount;
  },

  // User Preference Operations
  async getUserPreferences(userId: string): Promise<UserNotificationPreferenceDTO> {
    const pref = await userPreferenceRepository.getOrCreate(userId);
    return pref.toDTO();
  },

  async updateUserPreferences(
    userId: string,
    updates: UpdateNotificationPreferenceInput,
  ): Promise<UserNotificationPreferenceDTO> {
    const pref = await userPreferenceRepository.update(userId, updates);
    return pref.toDTO();
  },

  async registerPushToken(
    userId: string,
    input: RegisterPushTokenInput,
  ): Promise<UserNotificationPreferenceDTO> {
    const pref = await userPreferenceRepository.addPushToken(
      userId,
      input.token,
      input.deviceType,
    );
    return pref.toDTO();
  },

  async listUserNotifications(
    userId: string,
    options: { limit?: number; cursor?: string } = {},
  ): Promise<{ items: NotificationLogDTO[]; nextCursor: string | null }> {
    const res = await notificationLogRepository.listForUser(userId, options);
    return {
      items: res.items.map((i) => i.toDTO()),
      nextCursor: res.nextCursor,
    };
  },

  async getStats(): Promise<NotificationStatsDTO> {
    return notificationLogRepository.getStats();
  },
};
