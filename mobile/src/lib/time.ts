function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * Formats a JS Date's LOCAL calendar date as YYYY-MM-DD. Deliberately uses
 * local getters, not `toISOString()` (which is UTC and can silently shift
 * the calendar day by one near midnight in timezones ahead of UTC).
 */
export function dateToISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Formats a JS Date's LOCAL wall-clock time as 24-hour HH:mm — the API's
 * only accepted birth-time format (see shared-types/birthProfile.ts). The
 * native time picker returns an unambiguous `Date` under the hood
 * regardless of whether its face shows a 12-hour AM/PM dial; reading it
 * back with `getHours()`/`getMinutes()` sidesteps the classic "was that 12
 * AM or 12 PM" text-parsing bug entirely — there's no string to
 * misinterpret.
 */
export function dateToTime24(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** A human-readable 12-hour label for a 24h HH:mm value, e.g. "8:30 AM" —
 * used to show the selected time back to the user for confirmation. */
export function formatTime12Hour(time24: string): string {
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${pad2(minutes)} ${period}`;
}

/**
 * A clarifying note shown only for the two genuinely ambiguous wall-clock
 * moments, so a user who picked "12:00" on either dial always sees which
 * one they mean confirmed back in words (CLAUDE.md's "12 AM / 12 PM
 * confusion" requirement) — not just relying on AM/PM never being
 * mis-tapped.
 */
export function midnightOrNoonNote(time24: string): string | null {
  if (time24 === '00:00') return 'That’s midnight — the very start of the day.';
  if (time24 === '12:00') return 'That’s noon — the middle of the day.';
  return null;
}

export function parseISODateToLocalDate(isoDate: string): Date {
  const parts = isoDate.split('-').map(Number);
  const [year = 1970, month = 1, day = 1] = parts;
  return new Date(year, month - 1, day);
}

export function applyTime24ToDate(baseDate: Date, time24: string): Date {
  const parts = time24.split(':').map(Number);
  const [hours = 0, minutes = 0] = parts;
  const next = new Date(baseDate);
  next.setHours(hours, minutes, 0, 0);
  return next;
}
