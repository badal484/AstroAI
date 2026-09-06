import type {
  NotificationLogDTO,
  RegisterPushTokenInput,
  UpdateNotificationPreferenceInput,
  UserNotificationPreferenceDTO,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export const notificationApi = {
  /**
   * Fetches user's notification preferences, quiet hours & category toggles.
   */
  async getPreferences(): Promise<UserNotificationPreferenceDTO> {
    return apiRequest<UserNotificationPreferenceDTO>('/api/v1/notifications/preferences', {
      method: 'GET',
    });
  },

  /**
   * Updates user's notification preferences, quiet hours, language & toggles.
   */
  async updatePreferences(
    input: UpdateNotificationPreferenceInput,
  ): Promise<UserNotificationPreferenceDTO> {
    return apiRequest<UserNotificationPreferenceDTO>('/api/v1/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  /**
   * Registers user's FCM/APNs push token.
   */
  async registerPushToken(
    input: RegisterPushTokenInput,
  ): Promise<UserNotificationPreferenceDTO> {
    return apiRequest<UserNotificationPreferenceDTO>('/api/v1/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Fetches in-app notification center inbox.
   */
  async getInbox(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ items: NotificationLogDTO[]; nextCursor: string | null }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);

    return apiRequest<{ items: NotificationLogDTO[]; nextCursor: string | null }>(
      `/api/v1/notifications/inbox?${query.toString()}`,
      { method: 'GET' },
    );
  },
};
