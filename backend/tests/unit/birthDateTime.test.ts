import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  assertNotFutureDateOfBirth,
  assertValidCivilDate,
} from '../../src/modules/birthProfiles/birthDateTime';
import { FutureDateOfBirthError, ValidationError } from '../../src/shared/errors';

describe('assertValidCivilDate', () => {
  it('accepts a real calendar date', () => {
    expect(() => assertValidCivilDate('1990-05-14')).not.toThrow();
  });

  it('rejects a non-existent calendar date (Feb 30)', () => {
    expect(() => assertValidCivilDate('1990-02-30')).toThrow(ValidationError);
  });

  it('rejects an out-of-range month', () => {
    expect(() => assertValidCivilDate('1990-13-01')).toThrow(ValidationError);
  });

  it('rejects a year before 1900', () => {
    expect(() => assertValidCivilDate('1850-01-01')).toThrow(ValidationError);
  });
});

describe('assertNotFutureDateOfBirth', () => {
  it('accepts a clearly past date/time', () => {
    expect(() =>
      assertNotFutureDateOfBirth({
        dateOfBirth: '1990-05-14',
        birthTime: '08:30',
        timezone: 'Asia/Kolkata',
      }),
    ).not.toThrow();
  });

  it('rejects a future date/time', () => {
    const future = DateTime.now().plus({ years: 1 }).toFormat('yyyy-LL-dd');
    expect(() =>
      assertNotFutureDateOfBirth({
        dateOfBirth: future,
        birthTime: '00:00',
        timezone: 'Asia/Kolkata',
      }),
    ).toThrow(FutureDateOfBirthError);
  });

  it('accepts today with an unknown birth time even if it is already past midnight there', () => {
    const todayInTokyo = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy-LL-dd');
    expect(() =>
      assertNotFutureDateOfBirth({
        dateOfBirth: todayInTokyo,
        birthTime: null,
        timezone: 'Asia/Tokyo',
      }),
    ).not.toThrow();
  });

  it('rejects a specific time later today in the birth location, even though the exact same UTC instant is still "yesterday" somewhere else', () => {
    // Baker Island (UTC-12) is the last place on Earth to reach any given
    // date — a birth "tomorrow, 00:01" there is still in the future
    // relative to "now" there, and must be rejected using ITS clock, not
    // the server's UTC clock.
    const tomorrowThere = DateTime.now()
      .setZone('Etc/GMT+12')
      .plus({ days: 1 })
      .toFormat('yyyy-LL-dd');
    expect(() =>
      assertNotFutureDateOfBirth({
        dateOfBirth: tomorrowThere,
        birthTime: '00:01',
        timezone: 'Etc/GMT+12',
      }),
    ).toThrow(FutureDateOfBirthError);
  });

  it('rejects an invalid time value combined with a valid date', () => {
    expect(() =>
      assertNotFutureDateOfBirth({
        dateOfBirth: '1990-05-14',
        birthTime: '25:99',
        timezone: 'UTC',
      }),
    ).toThrow(ValidationError);
  });
});
