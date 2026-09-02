import { Schema, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';

/**
 * Shared session schema used by both end-user and admin sessions (separate
 * collections/models — see ARCHITECTURE.md §14 on keeping the two auth
 * systems fully independent). A session represents one issued refresh
 * token; the access token itself is never persisted (it's a short-lived,
 * stateless JWT).
 */
export function createSessionSchema() {
  const schema = new Schema(
    {
      subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
      refreshTokenHash: { type: String, required: true, unique: true },
      userAgent: { type: String, default: null },
      ip: { type: String, default: null },
      expiresAt: { type: Date, required: true },
      revokedAt: { type: Date, default: null },
      // Set when this session's refresh token is rotated to a new one —
      // if the OLD token is ever presented again after this is set, that's
      // reuse (theft/replay), and the whole session family is revoked.
      replacedByTokenHash: { type: String, default: null },
    },
    { timestamps: true },
  );

  // Sessions are naturally bounded (CLAUDE.md §47): Mongo removes a
  // document once its expiresAt is in the past, revoked or not.
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  return schema;
}

export type SessionSchemaType = InferSchemaType<ReturnType<typeof createSessionSchema>>;
export type SessionDocument = HydratedDocument<SessionSchemaType>;
export type SessionModelType = Model<SessionSchemaType>;
