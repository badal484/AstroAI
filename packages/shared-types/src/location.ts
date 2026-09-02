import { z } from 'zod';

/**
 * A location as normalized and stored server-side (ARCHITECTURE.md's birth
 * profile "canonical name, latitude, longitude, timezone, country"
 * requirement). `timezone` is always an IANA identifier resolved from
 * coordinates server-side — never trusted from client input — because it's
 * the one field that actually changes astrology math.
 */
export interface NormalizedLocation {
  canonicalName: string;
  latitude: number;
  longitude: number;
  /** IANA timezone identifier, e.g. "Asia/Kolkata". */
  timezone: string;
  country: string;
  countryCode: string;
  /** Provider-specific place id, when resolved via a location provider
   * (absent for manually-entered locations). Kept for re-resolution/audit. */
  placeId: string | null;
}

/** One candidate returned by a location search, before a user disambiguates. */
export interface LocationCandidate {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
}

export const locationSearchQuerySchema = z.object({
  query: z.string().trim().min(2, 'Enter at least 2 characters').max(200),
});
export type LocationSearchQuery = z.infer<typeof locationSearchQuerySchema>;

/**
 * How a birth profile's location was supplied. `placeId` is the normal path
 * (chosen from search results, so ambiguous places are disambiguated by the
 * user before submission). `manual` is a fallback for when the location
 * provider is unconfigured or a place genuinely isn't in it (a small
 * village, historical place name, ...) — `timezone`/`country` are still
 * always computed server-side from the given coordinates, never taken from
 * this input, so this path can't silently produce a wrong-timezone chart.
 */
export const locationInputSchema = z.union([
  z.object({ placeId: z.string().trim().min(1) }).strict(),
  z
    .object({
      manual: z
        .object({
          canonicalName: z.string().trim().min(1).max(200),
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-180).max(180),
          country: z.string().trim().min(1).max(100),
          countryCode: z
            .string()
            .trim()
            .length(2)
            .transform((value) => value.toUpperCase()),
        })
        .strict(),
    })
    .strict(),
]);
export type LocationInput = z.infer<typeof locationInputSchema>;
