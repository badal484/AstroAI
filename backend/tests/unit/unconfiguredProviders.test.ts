import { describe, expect, it } from 'vitest';
import { unconfiguredLocationProvider } from '../../src/modules/location/providers/unconfigured.provider';
import { unconfiguredEngine } from '../../src/modules/astrology/engine/unconfiguredEngine';
import { LocationProviderUnavailableError } from '../../src/shared/errors';
import { AstrologyEngineUnavailableError } from '../../src/shared/errors';
import { TimeConfidence } from '@astroai/shared-types';

/**
 * CLAUDE.md §51: "Do not hardcode fake astrology results as if they were
 * real" / no fake provider responses. These are the default providers when
 * nothing real is configured — they must fail loudly and clearly, never
 * silently return empty/fabricated data.
 */
describe('unconfiguredLocationProvider', () => {
  it('rejects search with a clear, typed error', async () => {
    await expect(unconfiguredLocationProvider.search('Springfield')).rejects.toBeInstanceOf(
      LocationProviderUnavailableError,
    );
  });

  it('rejects resolve with a clear, typed error', async () => {
    await expect(unconfiguredLocationProvider.resolve('some-place-id')).rejects.toBeInstanceOf(
      LocationProviderUnavailableError,
    );
  });
});

describe('unconfiguredEngine', () => {
  const input = {
    dateOfBirth: '1990-05-14',
    birthTime: '08:30',
    timeConfidence: TimeConfidence.EXACT,
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  it('rejects computeChart rather than returning fabricated facts', async () => {
    await expect(unconfiguredEngine.computeChart(input)).rejects.toBeInstanceOf(
      AstrologyEngineUnavailableError,
    );
  });

  it('rejects computeTransits', async () => {
    await expect(unconfiguredEngine.computeTransits(input, '2026-01-01')).rejects.toBeInstanceOf(
      AstrologyEngineUnavailableError,
    );
  });

  it('rejects computeCompatibility', async () => {
    await expect(unconfiguredEngine.computeCompatibility(input, input)).rejects.toBeInstanceOf(
      AstrologyEngineUnavailableError,
    );
  });
});
