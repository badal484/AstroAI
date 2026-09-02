import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { AccountStatus, AdminRole } from '@astroai/shared-types';

const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(AdminRole), required: true },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      required: true,
    },
  },
  { timestamps: true },
);

export type AdminUserSchemaType = InferSchemaType<typeof adminUserSchema>;
export type AdminUserDocument = HydratedDocument<AdminUserSchemaType>;

export const AdminUserModel = model('AdminUser', adminUserSchema);
