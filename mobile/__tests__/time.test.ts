import {
  applyTime24ToDate,
  dateToISODate,
  dateToTime24,
  formatTime12Hour,
  midnightOrNoonNote,
  parseISODateToLocalDate,
} from '../src/lib/time';

describe('dateToISODate', () => {
  it('formats using local calendar fields, not UTC', () => {
    // 11:30pm local — toISOString() would roll this to the next UTC day in
    // any timezone west of UTC-0.5h; the local calendar date must not move.
    const date = new Date(1990, 4, 14, 23, 30);
    expect(dateToISODate(date)).toBe('1990-05-14');
  });

  it('pads single-digit months and days', () => {
    expect(dateToISODate(new Date(2005, 0, 5))).toBe('2005-01-05');
  });
});

describe('dateToTime24', () => {
  it('formats midnight as 00:00', () => {
    expect(dateToTime24(new Date(2020, 0, 1, 0, 0))).toBe('00:00');
  });

  it('formats noon as 12:00', () => {
    expect(dateToTime24(new Date(2020, 0, 1, 12, 0))).toBe('12:00');
  });

  it('pads single-digit hours and minutes', () => {
    expect(dateToTime24(new Date(2020, 0, 1, 8, 5))).toBe('08:05');
  });
});

describe('formatTime12Hour', () => {
  it('formats midnight as 12:00 AM (not 0:00 AM)', () => {
    expect(formatTime12Hour('00:00')).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM (not 0:00 PM)', () => {
    expect(formatTime12Hour('12:00')).toBe('12:00 PM');
  });

  it('formats an ordinary morning time', () => {
    expect(formatTime12Hour('08:30')).toBe('8:30 AM');
  });

  it('formats an ordinary afternoon time', () => {
    expect(formatTime12Hour('13:05')).toBe('1:05 PM');
  });

  it('formats one minute before midnight', () => {
    expect(formatTime12Hour('23:59')).toBe('11:59 PM');
  });
});

describe('midnightOrNoonNote', () => {
  it('flags exactly midnight', () => {
    expect(midnightOrNoonNote('00:00')).toMatch(/midnight/i);
  });

  it('flags exactly noon', () => {
    expect(midnightOrNoonNote('12:00')).toMatch(/noon/i);
  });

  it('says nothing for an unambiguous time', () => {
    expect(midnightOrNoonNote('08:30')).toBeNull();
    expect(midnightOrNoonNote('23:59')).toBeNull();
    expect(midnightOrNoonNote('00:01')).toBeNull();
  });
});

describe('parseISODateToLocalDate / applyTime24ToDate round-trip', () => {
  it('round-trips a date through dateToISODate', () => {
    const iso = '1990-05-14';
    expect(dateToISODate(parseISODateToLocalDate(iso))).toBe(iso);
  });

  it('round-trips a time through dateToTime24', () => {
    const base = parseISODateToLocalDate('1990-05-14');
    const withTime = applyTime24ToDate(base, '08:30');
    expect(dateToTime24(withTime)).toBe('08:30');
    // Applying a time must not change the calendar date it was applied to.
    expect(dateToISODate(withTime)).toBe('1990-05-14');
  });
});
