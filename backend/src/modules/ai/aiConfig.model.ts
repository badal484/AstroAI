import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { AIProviderName, ModelAlias } from '@astroai/shared-types';

const routingCandidateSchema = new Schema(
  {
    provider: { type: String, enum: Object.values(AIProviderName), required: true },
    model: { type: String, required: true },
  },
  { _id: false },
);

/**
 * One document per alias — an admin override of `DEFAULT_AI_ROUTING`
 * (ARCHITECTURE.md §5: "Alias → provider/model mapping lives in an
 * admin-editable `aiProviderConfigs` collection"). An alias with no
 * document here simply uses the built-in default; nothing needs to be
 * seeded for the system to work.
 */
const aiRoutingConfigSchema = new Schema(
  {
    alias: { type: String, enum: Object.values(ModelAlias), required: true, unique: true },
    candidates: { type: [routingCandidateSchema], required: true },
  },
  { timestamps: true },
);

export type AIRoutingConfigSchemaType = InferSchemaType<typeof aiRoutingConfigSchema>;
export type AIRoutingConfigDocument = HydratedDocument<AIRoutingConfigSchemaType>;
export const AIRoutingConfigModel = model('AIRoutingConfig', aiRoutingConfigSchema);
