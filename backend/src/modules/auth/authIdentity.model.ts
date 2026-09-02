import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { AuthProviderType } from '@astroai/shared-types';

/**
 * Links a verified external identity (Google `sub`, eventually a phone
 * number for OTP, ...) to a local User. Kept as its own collection rather
 * than fields on User so a user can eventually link multiple providers to
 * one account without a schema change (CLAUDE.md's "support future
 * authentication providers without rewriting the user system").
 */
const authIdentitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    provider: { type: String, enum: Object.values(AuthProviderType), required: true },
    providerId: { type: String, required: true },
  },
  { timestamps: true },
);

authIdentitySchema.index({ provider: 1, providerId: 1 }, { unique: true });

export type AuthIdentitySchemaType = InferSchemaType<typeof authIdentitySchema>;
export type AuthIdentityDocument = HydratedDocument<AuthIdentitySchemaType>;

export const AuthIdentityModel = model('AuthIdentity', authIdentitySchema);
