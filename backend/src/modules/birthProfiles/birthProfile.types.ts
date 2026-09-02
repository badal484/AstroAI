import type { BirthProfile, NormalizedLocation } from '@astroai/shared-types';
import type { BirthProfileDocument } from './birthProfile.model';

/** Mongoose's `InferSchemaType` widens fields without `required: true` to
 * include `undefined` even when a `default` guarantees a value at runtime
 * (here, `null`) — normalize that at this one boundary rather than
 * threading `?? null` through every call site. */
export function toNormalizedLocation(
  location: BirthProfileDocument['location'],
): NormalizedLocation {
  return {
    canonicalName: location.canonicalName,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    country: location.country,
    countryCode: location.countryCode,
    placeId: location.placeId ?? null,
  };
}

export function toBirthProfile(doc: BirthProfileDocument): BirthProfile {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    dateOfBirth: doc.dateOfBirth,
    birthTime: doc.birthTime ?? null,
    timeConfidence: doc.timeConfidence,
    location: toNormalizedLocation(doc.location),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
