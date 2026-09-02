import type { AuthResponse } from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  return apiRequest('/api/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export function refreshSession(refreshToken: string): Promise<AuthResponse> {
  return apiRequest(
    '/api/v1/auth/refresh',
    { method: 'POST', body: JSON.stringify({ refreshToken }) },
    { skipAuth: true, skipRetry: true },
  );
}

export function logoutSession(
  refreshToken: string,
): Promise<{ success: true }> {
  return apiRequest(
    '/api/v1/auth/logout',
    { method: 'POST', body: JSON.stringify({ refreshToken }) },
    { skipAuth: true, skipRetry: true },
  );
}

export function deleteAccount(): Promise<{ success: true }> {
  return apiRequest('/api/v1/auth/me', { method: 'DELETE' });
}
