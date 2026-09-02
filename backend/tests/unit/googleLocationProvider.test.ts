import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleLocationProvider } from '../../src/modules/location/providers/google.provider';
import { LocationNotFoundError, LocationProviderUnavailableError } from '../../src/shared/errors';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const springfieldResult = (state: string, placeSuffix: string) => ({
  place_id: `place-springfield-${placeSuffix}`,
  formatted_address: `Springfield, ${state}, USA`,
  geometry: { location: { lat: 39.5, lng: -89.5 } },
  address_components: [{ long_name: 'United States', short_name: 'US', types: ['country'] }],
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('googleLocationProvider.search', () => {
  it('surfaces multiple candidates for an ambiguous query, letting the caller disambiguate', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 'OK',
        results: [springfieldResult('IL', 'il'), springfieldResult('MO', 'mo')],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const candidates = await googleLocationProvider.search('Springfield');

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({ placeId: 'place-springfield-il', countryCode: 'US' });
    expect(candidates[1]).toMatchObject({ placeId: 'place-springfield-mo' });
  });

  it('returns an empty array (not an error) for zero results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'ZERO_RESULTS', results: [] })),
    );

    await expect(googleLocationProvider.search('asdkjhaskjdh')).resolves.toEqual([]);
  });

  it('throws a clear error on a provider-side failure rather than a raw fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(googleLocationProvider.search('Delhi')).rejects.toBeInstanceOf(
      LocationProviderUnavailableError,
    );
  });

  it('throws when the API returns a non-OK HTTP status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));

    await expect(googleLocationProvider.search('Delhi')).rejects.toBeInstanceOf(
      LocationProviderUnavailableError,
    );
  });
});

describe('googleLocationProvider.resolve', () => {
  it('resolves a place id to its coordinates and country', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: 'OK',
          results: [springfieldResult('IL', 'il')],
        }),
      ),
    );

    const resolved = await googleLocationProvider.resolve('place-springfield-il');
    expect(resolved).toMatchObject({
      canonicalName: 'Springfield, IL, USA',
      latitude: 39.5,
      longitude: -89.5,
      country: 'United States',
      countryCode: 'US',
      placeId: 'place-springfield-il',
    });
  });

  it('throws LocationNotFoundError when the place id matches nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'ZERO_RESULTS', results: [] })),
    );

    await expect(googleLocationProvider.resolve('does-not-exist')).rejects.toBeInstanceOf(
      LocationNotFoundError,
    );
  });
});
