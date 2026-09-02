import { LocationProviderUnavailableError } from '../../../shared/errors';
import type { LocationProviderAdapter } from '../location.provider.types';

/**
 * Default provider when `LOCATION_PROVIDER=none` (the default). Deliberately
 * does not fabricate results — CLAUDE.md §51 forbids fake provider
 * responses. Callers get a clear, typed error they can render as "location
 * search isn't available — enter it manually" rather than a silent empty
 * list or made-up coordinates.
 */
export const unconfiguredLocationProvider: LocationProviderAdapter = {
  providerId: 'none',

  search() {
    return Promise.reject(new LocationProviderUnavailableError());
  },

  resolve() {
    return Promise.reject(new LocationProviderUnavailableError());
  },
};
