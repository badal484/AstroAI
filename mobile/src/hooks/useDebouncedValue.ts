import { useEffect, useState } from 'react';

/** Debounces a fast-changing value (e.g. search text) so callers only
 * react once typing pauses — used to avoid firing a location search
 * request on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
