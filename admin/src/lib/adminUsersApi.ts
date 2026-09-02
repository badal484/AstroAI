import type { AuthUser, PaginatedResult } from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function listUsers(cursor?: string): Promise<PaginatedResult<AuthUser>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest(`/api/v1/admin/users${query}`);
}

export function suspendUser(id: string): Promise<AuthUser> {
  return apiRequest(`/api/v1/admin/users/${id}/suspend`, { method: 'POST' });
}

export function reactivateUser(id: string): Promise<AuthUser> {
  return apiRequest(`/api/v1/admin/users/${id}/reactivate`, { method: 'POST' });
}
