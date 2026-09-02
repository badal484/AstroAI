import type {
  BirthProfile,
  CreateBirthProfileInput,
  UpdateBirthProfileInput,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function listBirthProfiles(): Promise<{ items: BirthProfile[] }> {
  return apiRequest('/api/v1/birth-profiles');
}

export function getBirthProfile(id: string): Promise<BirthProfile> {
  return apiRequest(`/api/v1/birth-profiles/${id}`);
}

export function createBirthProfile(
  input: CreateBirthProfileInput,
): Promise<BirthProfile> {
  return apiRequest('/api/v1/birth-profiles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBirthProfile(
  id: string,
  input: UpdateBirthProfileInput,
): Promise<BirthProfile> {
  return apiRequest(`/api/v1/birth-profiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteBirthProfile(id: string): Promise<{ success: true }> {
  return apiRequest(`/api/v1/birth-profiles/${id}`, { method: 'DELETE' });
}
