import { find as findTimezones } from 'geo-tz/dist/find-all';
import type { LocationCandidate, LocationInput, NormalizedLocation } from '@astroai/shared-types';
import { env } from '../../config/env';
import { redis } from '../../lib/redis';
import { LocationNotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import type { LocationProviderAdapter } from './location.provider.types';
import { googleLocationProvider } from './providers/google.provider';
import { unconfiguredLocationProvider } from './providers/unconfigured.provider';

// Geocoding results for a fixed query/place id are effectively static —
// cache generously (CLAUDE.md §41) to cut provider cost/latency.
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

function currentProvider(): LocationProviderAdapter {
  switch (env.LOCATION_PROVIDER) {
    case 'google':
      return googleLocationProvider;
    case 'none':
    default:
      return unconfiguredLocationProvider;
  }
}

/**
 * Resolves an IANA timezone from coordinates using the local (offline,
 * no-network) tz-boundary dataset — authoritative and independent of the
 * location provider, and correct for historical birth dates (the
 * "comprehensive" geo-tz dataset accounts for timezone boundaries that
 * existed before 1970, not just current ones — CLAUDE.md's "historical
 * timezone differences" requirement).
 */
function resolveTimezone(latitude: number, longitude: number): string {
  const zones = findTimezones(latitude, longitude);
  const zone = zones[0];
  if (!zone) {
    logger.warn({ latitude, longitude }, 'No timezone found for coordinates');
    throw new LocationNotFoundError('Could not determine a timezone for these coordinates');
  }
  return zone;
}

async function cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;

  const value = await compute();
  await redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
  return value;
}

export const locationService = {
  search(query: string): Promise<LocationCandidate[]> {
    const cacheKey = `location:search:${env.LOCATION_PROVIDER}:${query.trim().toLowerCase()}`;
    return cached(cacheKey, () => currentProvider().search(query));
  },

  async resolveInput(input: LocationInput): Promise<NormalizedLocation> {
    if ('placeId' in input) {
      return locationService.resolveByPlaceId(input.placeId);
    }

    const { manual } = input;
    return {
      canonicalName: manual.canonicalName,
      latitude: manual.latitude,
      longitude: manual.longitude,
      country: manual.country,
      countryCode: manual.countryCode,
      timezone: resolveTimezone(manual.latitude, manual.longitude),
      placeId: null,
    };
  },

  resolveByPlaceId(placeId: string): Promise<NormalizedLocation> {
    const cacheKey = `location:place:${env.LOCATION_PROVIDER}:${placeId}`;
    return cached(cacheKey, async () => {
      const resolved = await currentProvider().resolve(placeId);
      return {
        ...resolved,
        timezone: resolveTimezone(resolved.latitude, resolved.longitude),
      };
    });
  },
};
