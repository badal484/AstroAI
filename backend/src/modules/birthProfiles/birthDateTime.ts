import { DateTime } from 'luxon';
import { FutureDateOfBirthError, ValidationError } from '../../shared/errors';

const MIN_BIRTH_YEAR = 1900;

/**
 * Catches what the wire-format regex can't: real calendar validity
 * (rejects Feb 30, month 13, ...) and an implausible year. The regex in
 * `createBirthProfileSchema` only checks shape, not that the date exists.
 */
export function assertValidCivilDate(dateOfBirth: string): void {
  const parsed = DateTime.fromISO(dateOfBirth, { zone: 'utc' });
  if (!parsed.isValid) {
    throw new ValidationError(
      `Invalid date of birth${parsed.invalidExplanation ? `: ${parsed.invalidExplanation}` : ''}`,
    );
  }
  if (parsed.year < MIN_BIRTH_YEAR) {
    throw new ValidationError(`Date of birth must be in ${MIN_BIRTH_YEAR} or later`);
  }
}

/**
 * Authoritative "not in the future" check, evaluated in the birth
 * location's own timezone rather than the server's or the client's — a
 * birth "today" must never be rejected just because it's already tomorrow
 * in UTC, and a birth that's still "tomorrow" locally must be rejected
 * even if it's already today in UTC (CLAUDE.md's "future DOB" + "timezone
 * issues" requirements).
 *
 * When the birth time is unknown, only the calendar date is compared (a
 * birth profile dated "today" is always valid regardless of what time it
 * is right now — we don't know yet whether that moment has passed).
 */
export function assertNotFutureDateOfBirth(params: {
  dateOfBirth: string;
  birthTime: string | null;
  timezone: string;
}): void {
  const { dateOfBirth, birthTime, timezone } = params;
  const nowInLocation = DateTime.now().setZone(timezone);

  if (!birthTime) {
    const birthDate = DateTime.fromISO(dateOfBirth, { zone: timezone }).startOf('day');
    if (birthDate > nowInLocation.startOf('day')) {
      throw new FutureDateOfBirthError();
    }
    return;
  }

  const birthDateTime = DateTime.fromISO(`${dateOfBirth}T${birthTime}:00`, { zone: timezone });
  if (!birthDateTime.isValid) {
    throw new ValidationError('Invalid date/time for the given birth location');
  }
  if (birthDateTime > nowInLocation) {
    throw new FutureDateOfBirthError();
  }
}
