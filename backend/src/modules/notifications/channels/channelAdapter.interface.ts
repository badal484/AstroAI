import type { NotificationChannel } from '@astroai/shared-types';

export interface ChannelSendPayload {
  recipient: string; // push token, email address, etc.
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface ChannelSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
}

export interface NotificationChannelAdapter {
  readonly channel: NotificationChannel;
  send(payload: ChannelSendPayload): Promise<ChannelSendResult>;
}
