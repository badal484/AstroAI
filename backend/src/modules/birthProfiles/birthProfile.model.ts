import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { TimeConfidence } from '@astroai/shared-types';

const normalizedLocationSchema = new Schema(
  {
    canonicalName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timezone: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    placeId: { type: String, default: null },
  },
  { _id: false },
);

const birthProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    // Civil date/time as entered, stored as plain strings (not a JS Date) —
    // a Date would force an implicit UTC/local reinterpretation that can
    // silently shift the calendar day. These are interpreted against
    // `location.timezone` wherever they're used (birthDateTime.ts, the
    // astrology engine input), never against the server's local time.
    dateOfBirth: { type: String, required: true },
    birthTime: { type: String, default: null },
    timeConfidence: { type: String, enum: Object.values(TimeConfidence), required: true },
    location: { type: normalizedLocationSchema, required: true },
  },
  { timestamps: true },
);

birthProfileSchema.index({ userId: 1, createdAt: -1 });

export type BirthProfileSchemaType = InferSchemaType<typeof birthProfileSchema>;
export type BirthProfileDocument = HydratedDocument<BirthProfileSchemaType>;

export const BirthProfileModel = model('BirthProfile', birthProfileSchema);
