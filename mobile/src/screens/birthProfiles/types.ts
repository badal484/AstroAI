import type { NormalizedLocation } from '@astroai/shared-types';

/**
 * What the location step of the form has settled on — either a place the
 * user picked from search (previewed with its server-resolved timezone) or
 * a manually-entered one (used when search is unavailable or a place
 * genuinely isn't found). Kept separate from react-hook-form's flat field
 * model since it's built from an async search-and-pick flow, not typed
 * directly into a single field.
 */
export type LocationSelection =
  | { mode: 'placeId'; placeId: string; preview: NormalizedLocation }
  | {
      mode: 'manual';
      manual: {
        canonicalName: string;
        latitude: number;
        longitude: number;
        country: string;
        countryCode: string;
      };
    };
