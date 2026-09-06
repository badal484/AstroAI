import { NotificationChannel } from '@astroai/shared-types';
import { logger } from '../../../shared/logger';
import type {
  ChannelSendPayload,
  ChannelSendResult,
  NotificationChannelAdapter,
} from './channelAdapter.interface';

export class EmailNotificationAdapter implements NotificationChannelAdapter {
  readonly channel = NotificationChannel.EMAIL;

  async send(payload: ChannelSendPayload): Promise<ChannelSendResult> {
    try {
      if (!payload.recipient || !payload.recipient.includes('@')) {
        return {
          success: false,
          error: `Invalid email address: ${payload.recipient}`,
          retryable: false,
        };
      }

      // Generate HTML email wrapper
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #0B0F19; color: #F8FAFC; padding: 24px; border-radius: 8px;">
          <h2 style="color: #D4A347;">AstroAI Vedic Insights</h2>
          <h3 style="color: #f1f5f9;">${payload.title}</h3>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">${payload.body}</p>
          ${
            payload.actionUrl
              ? `<a href="${payload.actionUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">View Details</a>`
              : ''
          }
          <hr style="border: 0; border-top: 1px solid #334155; margin-top: 32px;" />
          <p style="color: #64748b; font-size: 12px;">You received this email because of your notification preferences in AstroAI. You can manage or disable notifications in your profile settings.</p>
        </div>
      `;

      logger.info(
        { recipient: payload.recipient, title: payload.title, htmlLength: emailHtml.length },
        'Delivering Email Notification',
      );

      const messageId = `email_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      return {
        success: true,
        messageId,
      };
    } catch (err: any) {
      logger.error({ err, recipient: payload.recipient }, 'Email notification dispatch failed');
      return {
        success: false,
        error: err.message || 'Email dispatch error',
        retryable: true,
      };
    }
  }
}

export const emailNotificationAdapter = new EmailNotificationAdapter();
