import type {
  LocationCandidate,
  NormalizedLocation,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function searchLocations(
  query: string,
): Promise<{ candidates: LocationCandidate[] }> {
  return apiRequest(
    `/api/v1/locations/search?query=${encodeURIComponent(query)}`,
  );
}

export function resolveLocation(placeId: string): Promise<NormalizedLocation> {
  return apiRequest(`/api/v1/locations/${encodeURIComponent(placeId)}`);
}
