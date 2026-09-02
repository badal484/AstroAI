import { z } from 'zod';
import { locationInputSchema, type NormalizedLocation } from './location';

/**
 * How certain the user is about the birth time entered (CLAUDE.md §20).
 * Carried all the way through to the astrology engine, which must degrade
 * ascendant/house-based facts rather than presenting a guess as exact.
 */
export const TimeConfidence = {
  EXACT: 'exact',
  APPROXIMATE: 'approximate',
  UNKNOWN: 'unknown',
} as const;
export type TimeConfidence = (typeof TimeConfidence)[keyof typeof TimeConfidence];

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format');

/**
 * 24-hour HH:mm only. This is a deliberate design choice, not an
 * oversight: accepting a 12-hour "12:00 AM/PM" string on the wire is
 * exactly how the classic midnight/noon mixup happens. The mobile app's
 * time picker always produces an unambiguous 24-hour value (see
 * mobile/src/lib/time.ts's `to24Hour`), so the ambiguity never reaches the
 * API at all.
 */
const time24Schema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Birth time must be a valid 24-hour HH:mm value');

const birthProfileBaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  dateOfBirth: isoDateSchema,
  timeConfidence: z.nativeEnum(TimeConfidence),
  birthTime: time24Schema.optional(),
  location: locationInputSchema,
});

/**
 * Cross-field rule: a birth time is required when the user claims exact or
 * approximate confidence, and must be omitted when unknown — the API
 * rejects a birth time silently attached to "unknown" rather than assuming
 * which one the client meant.
 */
export const createBirthProfileSchema = birthProfileBaseSchema.superRefine((value, ctx) => {
  if (value.timeConfidence === TimeConfidence.UNKNOWN) {
    if (value.birthTime !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthTime'],
        message: 'Birth time must be omitted when time confidence is "unknown"',
      });
    }
    return;
  }
  if (value.birthTime === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['birthTime'],
      message: 'Birth time is required for "exact" or "approximate" confidence',
    });
  }
});
export type CreateBirthProfileInput = z.infer<typeof createBirthProfileSchema>;

export const updateBirthProfileSchema = birthProfileBaseSchema
  .partial()
  .superRefine((value, ctx) => {
    if (value.timeConfidence === TimeConfidence.UNKNOWN && value.birthTime !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthTime'],
        message: 'Birth time must be omitted when time confidence is "unknown"',
      });
    }
  });
export type UpdateBirthProfileInput = z.infer<typeof updateBirthProfileSchema>;

export interface BirthProfile {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  birthTime: string | null;
  timeConfidence: TimeConfidence;
  location: NormalizedLocation;
  createdAt: string;
  updatedAt: string;
}
