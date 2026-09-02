import type { AdminLoginInput, AdminSessionUser } from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function adminLogin(input: AdminLoginInput): Promise<{ admin: AdminSessionUser }> {
  return apiRequest('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminLogout(): Promise<{ success: true }> {
  return apiRequest('/api/v1/admin/auth/logout', { method: 'POST' });
}

export function adminMe(): Promise<AdminSessionUser> {
  return apiRequest('/api/v1/admin/auth/me');
}
