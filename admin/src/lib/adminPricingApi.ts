import type {
  CreatePricingConfigInput,
  PaginatedResult,
  PricingConfig,
} from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function fetchActivePricing(): Promise<PricingConfig> {
  return apiRequest('/api/v1/admin/pricing');
}

export function fetchPricingVersions(
  limit = 20,
  cursor?: string,
): Promise<PaginatedResult<PricingConfig>> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  return apiRequest(`/api/v1/admin/pricing/versions?${params.toString()}`);
}

export function fetchPricingByVersion(version: number): Promise<PricingConfig> {
  return apiRequest(`/api/v1/admin/pricing/versions/${version}`);
}

export function createPricingVersion(
  input: CreatePricingConfigInput,
): Promise<PricingConfig> {
  return apiRequest('/api/v1/admin/pricing', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
