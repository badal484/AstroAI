import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';
import { AdminRole, AuditAction, AuditTargetType } from '@astroai/shared-types';

const auditLogSchema = new Schema(
  {
    adminId: { type: String, required: true, index: true },
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    adminRole: { type: String, enum: Object.values(AdminRole), required: true },
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    targetType: { type: String, enum: Object.values(AuditTargetType), required: true, index: true },
    targetId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    beforeState: { type: Schema.Types.Mixed, default: null },
    afterState: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogSchemaType = InferSchemaType<typeof auditLogSchema>;
export type AuditLogDocument = HydratedDocument<AuditLogSchemaType>;

export const AuditLogModel = model('AuditLog', auditLogSchema);
