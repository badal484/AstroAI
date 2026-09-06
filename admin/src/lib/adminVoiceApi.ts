import type {
  PaginatedResult,
  VoiceSessionDTO,
  VoiceTurnDTO,
} from '@astroai/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchAdminVoiceSessions(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
}): Promise<PaginatedResult<VoiceSessionDTO>> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.status && params.status !== 'all') query.set('status', params.status);

  const res = await fetch(`${API_BASE}/admin/voice/sessions?${query.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch voice sessions');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchAdminVoiceSessionDetails(sessionId: string): Promise<{
  session: VoiceSessionDTO;
  turns: VoiceTurnDTO[];
}> {
  const res = await fetch(`${API_BASE}/admin/voice/sessions/${sessionId}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch voice session details');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchAdminVoiceConfig(): Promise<{
  stt: string[];
  tts: string[];
}> {
  const res = await fetch(`${API_BASE}/admin/voice/config`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch voice config');
  }

  const json = await res.json();
  return json.data;
}

export async function updateAdminVoiceConfig(data: {
  sttCandidates: string[];
  ttsCandidates: string[];
}): Promise<{ stt: string[]; tts: string[] }> {
  const res = await fetch(`${API_BASE}/admin/voice/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update voice config');
  }

  const json = await res.json();
  return json.data;
}
