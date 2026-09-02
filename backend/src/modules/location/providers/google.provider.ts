import type { LocationCandidate, NormalizedLocation } from '@astroai/shared-types';
import { env } from '../../../config/env';
import { LocationNotFoundError, LocationProviderUnavailableError } from '../../../shared/errors';
import { logger } from '../../../shared/logger';
import type { LocationProviderAdapter } from '../location.provider.types';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResult {
  place_id: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  address_components: GoogleAddressComponent[];
}

interface GoogleGeocodeResponse {
  status: string;
  results: GoogleGeocodeResult[];
}

function extractCountry(components: GoogleAddressComponent[]): {
  country: string;
  countryCode: string;
} {
  const match = components.find((component) => component.types.includes('country'));
  return { country: match?.long_name ?? 'Unknown', countryCode: match?.short_name ?? 'XX' };
}

async function callGeocodeApi(params: Record<string, string>): Promise<GoogleGeocodeResult[]> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new LocationProviderUnavailableError(
      'GOOGLE_PLACES_API_KEY is not set — LOCATION_PROVIDER=google requires it',
    );
  }

  const url = new URL(GEOCODE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set('key', apiKey);

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch (error) {
    logger.error({ err: error }, 'Google Geocoding API request failed');
    throw new LocationProviderUnavailableError('Location provider request failed');
  }

  if (!response.ok) {
    logger.error({ status: response.status }, 'Google Geocoding API returned a non-OK HTTP status');
    throw new LocationProviderUnavailableError('Location provider request failed');
  }

  const body = (await response.json()) as GoogleGeocodeResponse;
  if (body.status === 'ZERO_RESULTS') return [];
  if (body.status !== 'OK') {
    logger.error({ status: body.status }, 'Google Geocoding API returned an error status');
    throw new LocationProviderUnavailableError('Location provider returned an error');
  }
  return body.results;
}

/**
 * Real geocoding adapter, active only when `LOCATION_PROVIDER=google` and
 * `GOOGLE_PLACES_API_KEY` is set. Uses the Geocoding API for both text
 * search (naturally returns multiple candidates for an ambiguous query —
 * this is how "ambiguous location" is handled, by surfacing choices rather
 * than guessing) and place_id resolution.
 */
export const googleLocationProvider: LocationProviderAdapter = {
  providerId: 'google',

  async search(query: string): Promise<LocationCandidate[]> {
    const results = await callGeocodeApi({ address: query });
    return results.map((result) => {
      const { country, countryCode } = extractCountry(result.address_components);
      return {
        placeId: result.place_id,
        displayName: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        country,
        countryCode,
      };
    });
  },

  async resolve(placeId: string): Promise<Omit<NormalizedLocation, 'timezone'>> {
    const results = await callGeocodeApi({ place_id: placeId });
    const result = results[0];
    if (!result) throw new LocationNotFoundError();

    const { country, countryCode } = extractCountry(result.address_components);
    return {
      canonicalName: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      country,
      countryCode,
      placeId: result.place_id,
    };
  },
};
