import type { LocationCandidate, NormalizedLocation } from '@astroai/shared-types';

/**
 * Pluggable location/geocoding provider — same "adapter behind an
 * interface" shape as the AI Gateway's `ProviderAdapter` and auth's
 * `AuthProviderAdapter` (ARCHITECTURE.md §5/§14), so a real geocoder can be
 * swapped in (or replaced) without touching `location.service.ts` or any
 * caller. Implementations return coordinates + a display name only —
 * timezone is deliberately NOT part of this interface, since it's always
 * computed from coordinates via the local IANA tz database
 * (`location.service.ts`), never trusted from a third party.
 */
export interface LocationProviderAdapter {
  readonly providerId: string;
  search(query: string): Promise<LocationCandidate[]>;
  resolve(placeId: string): Promise<Omit<NormalizedLocation, 'timezone'>>;
}
