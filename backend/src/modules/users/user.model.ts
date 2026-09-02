import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { AccountStatus, UserRole } from '@astroai/shared-types';

const userSchema = new Schema(
  {
    email: { type: String, default: null, unique: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, default: null, trim: true },
    avatarUrl: { type: String, default: null },
    language: { type: String, default: 'en' },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      required: true,
    },
  },
  { timestamps: true },
);

export type UserSchemaType = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserSchemaType>;

export const UserModel = model('User', userSchema);
