import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locationService } from '../../src/modules/location';
import { redis } from '../../src/lib/redis';

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as Response;
}

const delhiGeocodeResult = {
  place_id: 'place-delhi',
  formatted_address: 'New Delhi, Delhi, India',
  geometry: { location: { lat: 28.6139, lng: 77.209 } },
  address_components: [{ long_name: 'India', short_name: 'IN', types: ['country'] }],
};

beforeEach(async () => {
  await redis.flushall();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('locationService.resolveInput', () => {
  it('resolves a placeId via the provider and computes timezone from coordinates, not the provider', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 'OK', results: [delhiGeocodeResult] }));
    vi.stubGlobal('fetch', fetchMock);

    const location = await locationService.resolveInput({ placeId: 'place-delhi' });

    expect(location).toMatchObject({
      canonicalName: 'New Delhi, Delhi, India',
      country: 'India',
      countryCode: 'IN',
      timezone: 'Asia/Kolkata',
      placeId: 'place-delhi',
    });
  });

  it('caches a placeId resolution — a second lookup does not call the provider again', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 'OK', results: [delhiGeocodeResult] }));
    vi.stubGlobal('fetch', fetchMock);

    await locationService.resolveByPlaceId('place-delhi-cache-test');
    await locationService.resolveByPlaceId('place-delhi-cache-test');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resolves a manually-entered location, deriving timezone from coordinates', async () => {
    const location = await locationService.resolveInput({
      manual: {
        canonicalName: 'A remote village',
        latitude: 35.6762,
        longitude: 139.6503,
        country: 'Japan',
        countryCode: 'JP',
      },
    });

    expect(location).toEqual({
      canonicalName: 'A remote village',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      placeId: null,
    });
  });
});

describe('locationService.search', () => {
  it('caches search results per query — a repeated identical search does not re-call the provider', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 'OK', results: [delhiGeocodeResult] }));
    vi.stubGlobal('fetch', fetchMock);

    await locationService.search('New Delhi unique query');
    await locationService.search('New Delhi unique query');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
