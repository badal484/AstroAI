import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { SupportedLanguage } from '@astroai/shared-types';

/**
 * Admin-editable override of the active persona (CLAUDE.md §34). At most
 * one document is ever active at a time today — `personaId` is fixed to
 * `'active'` so `findOneAndUpdate` always targets the same document,
 * giving upsert-as-set semantics without a separate "activate" step. No
 * admin route writes this yet; `persona.service.ts` is ready for one.
 */
const personaSchema = new Schema(
  {
    personaId: { type: String, required: true, unique: true, default: 'active' },
    name: { type: String, required: true },
    description: { type: String, required: true },
    tone: { type: String, required: true },
    personalityTraits: { type: [String], required: true },
    expertise: { type: [String], required: true },
    supportedLanguages: { type: [String], enum: Object.values(SupportedLanguage), required: true },
    responseStyle: { type: String, required: true },
    greetingBehavior: { type: String, required: true },
    prohibitedBehaviors: { type: [String], required: true },
  },
  { timestamps: true },
);

export type PersonaSchemaType = InferSchemaType<typeof personaSchema>;
export type PersonaDocument = HydratedDocument<PersonaSchemaType>;
export const AstrologerPersonaModel = model('AstrologerPersona', personaSchema);
