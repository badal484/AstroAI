import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

const featureFlagSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    enabled: { type: Boolean, default: false, required: true },
    rolloutPercentage: { type: Number, default: 0, min: 0, max: 100, required: true },
    targetUserSegments: { type: [String], default: [] },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true },
);

export type FeatureFlagSchemaType = InferSchemaType<typeof featureFlagSchema>;
export type FeatureFlagDocument = HydratedDocument<FeatureFlagSchemaType>;

export const FeatureFlagModel = model('FeatureFlag', featureFlagSchema);
