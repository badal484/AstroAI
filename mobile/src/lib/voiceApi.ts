import type {
  EndVoiceSessionInput,
  StartVoiceSessionInput,
  VoiceHeartbeatInput,
  VoiceSessionDTO,
  VoiceSessionSummaryDTO,
  VoiceTurnDTO,
  VoiceTurnInput,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export async function startVoiceSession(
  input: StartVoiceSessionInput,
): Promise<VoiceSessionDTO> {
  return apiRequest<VoiceSessionDTO>('/api/v1/voice/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function sendVoiceTurn(
  sessionId: string,
  input: VoiceTurnInput,
): Promise<{
  turn: VoiceTurnDTO;
  audioBase64: string;
  mimeType: string;
  warning?: string;
}> {
  return apiRequest<{
    turn: VoiceTurnDTO;
    audioBase64: string;
    mimeType: string;
    warning?: string;
  }>(`/api/v1/voice/sessions/${sessionId}/turn`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function sendVoiceHeartbeat(
  sessionId: string,
  input: VoiceHeartbeatInput,
): Promise<{
  status: string;
  shouldEnd: boolean;
  remainingSeconds: number;
}> {
  return apiRequest<{
    status: string;
    shouldEnd: boolean;
    remainingSeconds: number;
  }>(`/api/v1/voice/sessions/${sessionId}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function endVoiceSession(
  sessionId: string,
  input: EndVoiceSessionInput,
): Promise<VoiceSessionSummaryDTO> {
  return apiRequest<VoiceSessionSummaryDTO>(
    `/api/v1/voice/sessions/${sessionId}/end`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function fetchVoiceSessionDetails(sessionId: string): Promise<{
  session: VoiceSessionDTO;
  turns: VoiceTurnDTO[];
}> {
  return apiRequest<{
    session: VoiceSessionDTO;
    turns: VoiceTurnDTO[];
  }>(`/api/v1/voice/sessions/${sessionId}`);
}
