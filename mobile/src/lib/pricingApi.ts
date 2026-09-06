import type { CreditPack, PricingExplanation } from '@astroai/shared-types';
import { apiRequest } from './apiClient';

export function fetchPricingExplanation(): Promise<PricingExplanation> {
  return apiRequest('/api/v1/pricing');
}

export function fetchCreditPacks(): Promise<CreditPack[]> {
  return apiRequest('/api/v1/pricing/packs');
}
