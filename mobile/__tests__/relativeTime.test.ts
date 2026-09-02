import { formatRelativeTime } from '../src/lib/relativeTime';

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

describe('formatRelativeTime', () => {
  it('shows "Just now" for a timestamp under a minute old', () => {
    expect(formatRelativeTime(isoMinutesAgo(0))).toBe('Just now');
  });

  it('shows minutes for a timestamp under an hour old', () => {
    expect(formatRelativeTime(isoMinutesAgo(5))).toBe('5m ago');
  });

  it('shows hours for a timestamp under a day old', () => {
    expect(formatRelativeTime(isoMinutesAgo(3 * 60))).toBe('3h ago');
  });

  it('shows "Yesterday" for a timestamp about a day old', () => {
    expect(formatRelativeTime(isoMinutesAgo(30 * 60))).toBe('Yesterday');
  });

  it('shows days for a timestamp under a week old', () => {
    expect(formatRelativeTime(isoMinutesAgo(4 * 24 * 60))).toBe('4d ago');
  });

  it('falls back to a short date for anything older than a week', () => {
    const result = formatRelativeTime(isoMinutesAgo(30 * 24 * 60));
    expect(result).not.toMatch(/ago|Yesterday|Just now/);
  });
});
