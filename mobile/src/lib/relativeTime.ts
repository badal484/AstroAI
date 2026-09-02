const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Short, human relative timestamp for a conversation list row — "Just now",
 * "5m ago", "3h ago", "Yesterday", or a short date once it's old enough
 * that a relative label stops being useful. */
export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const diff = Date.now() - then;

  if (diff < MINUTE_MS) return 'Just now';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  if (diff < 2 * DAY_MS) return 'Yesterday';
  if (diff < 7 * DAY_MS) return `${Math.floor(diff / DAY_MS)}d ago`;

  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
