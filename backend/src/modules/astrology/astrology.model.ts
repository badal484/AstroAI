import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type { CompatibilityScore } from '@astroai/shared-types';
import type { ComputedNatalChart } from './engine/astrologyEngine.types';

/**
 * `facts`/`score` are stored as `Mixed`: they're a deeply-nested computed
 * output written exclusively by the astrology engine and read back through
 * one typed cast at this module's boundary (`astrology.repository.ts`) —
 * TypeScript already enforces the shape via `ComputedNatalChart`/
 * `CompatibilityScore` at every write site, so hand-duplicating the same
 * nested structure again as a Mongoose schema would be pure boilerplate.
 */
const chartSchema = new Schema(
  {
    birthProfileId: { type: Schema.Types.ObjectId, required: true, unique: true },
    calculationVersion: { type: Number, required: true },
    engineProviderId: { type: String, required: true },
    facts: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export type ChartSchemaType = InferSchemaType<typeof chartSchema>;
// `Omit` first, then re-add: intersecting directly with `{ facts: ... }`
// wouldn't narrow anything, because TypeScript collapses `any & X` back to
// `any` (Mixed infers as `any`) — omitting the wide property before adding
// the narrow one back is the only way to actually override it.
export type ChartDocument = Omit<HydratedDocument<ChartSchemaType>, 'facts'> & {
  facts: ComputedNatalChart;
};
export const AstrologyChartModel = model('AstrologyChart', chartSchema);

const compatibilitySchema = new Schema(
  {
    // Sorted "idA:idB" so a lookup for (A,B) and (B,A) hit the same record.
    pairKey: { type: String, required: true, unique: true },
    birthProfileIdA: { type: Schema.Types.ObjectId, required: true },
    birthProfileIdB: { type: Schema.Types.ObjectId, required: true },
    calculationVersion: { type: Number, required: true },
    engineProviderId: { type: String, required: true },
    score: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export type CompatibilitySchemaType = InferSchemaType<typeof compatibilitySchema>;
export type CompatibilityDocument = Omit<HydratedDocument<CompatibilitySchemaType>, 'score'> & {
  score: CompatibilityScore;
};
export const AstrologyCompatibilityModel = model('AstrologyCompatibility', compatibilitySchema);
