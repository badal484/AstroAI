import type {
  CreateCampaignInput,
  CreateNotificationTemplateInput,
  NotificationCampaignDTO,
  NotificationLogDTO,
  NotificationStatsDTO,
  NotificationTemplateDTO,
  UpdateCampaignInput,
  UpdateNotificationTemplateInput,
} from '@astroai/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchNotificationStats(): Promise<NotificationStatsDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/stats`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch notification stats');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchNotificationTemplates(): Promise<NotificationTemplateDTO[]> {
  const res = await fetch(`${API_BASE}/admin/notifications/templates`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch templates');
  }

  const json = await res.json();
  return json.data;
}

export async function createNotificationTemplate(
  input: CreateNotificationTemplateInput,
): Promise<NotificationTemplateDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create template');
  }

  const json = await res.json();
  return json.data;
}

export async function updateNotificationTemplate(
  id: string,
  input: UpdateNotificationTemplateInput,
): Promise<NotificationTemplateDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update template');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchNotificationCampaigns(): Promise<NotificationCampaignDTO[]> {
  const res = await fetch(`${API_BASE}/admin/notifications/campaigns`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch campaigns');
  }

  const json = await res.json();
  return json.data;
}

export async function createNotificationCampaign(
  input: CreateCampaignInput,
): Promise<NotificationCampaignDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create campaign');
  }

  const json = await res.json();
  return json.data;
}

export async function updateNotificationCampaign(
  id: string,
  input: UpdateCampaignInput,
): Promise<NotificationCampaignDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update campaign');
  }

  const json = await res.json();
  return json.data;
}

export async function executeNotificationCampaign(id: string): Promise<NotificationCampaignDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/campaigns/${id}/execute`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to execute campaign');
  }

  const json = await res.json();
  return json.data;
}

export async function pauseNotificationCampaign(id: string): Promise<NotificationCampaignDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/campaigns/${id}/pause`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to pause campaign');
  }

  const json = await res.json();
  return json.data;
}

export async function resumeNotificationCampaign(id: string): Promise<NotificationCampaignDTO> {
  const res = await fetch(`${API_BASE}/admin/notifications/campaigns/${id}/resume`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to resume campaign');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchNotificationLogs(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
  channel?: string;
}): Promise<{ items: NotificationLogDTO[]; nextCursor: string | null }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.channel && params.channel !== 'all') query.set('channel', params.channel);

  const res = await fetch(`${API_BASE}/admin/notifications/logs?${query.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch logs');
  }

  const json = await res.json();
  return json.data;
}
