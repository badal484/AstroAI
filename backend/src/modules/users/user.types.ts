import type { AuthUser } from '@astroai/shared-types';
import type { UserDocument } from './user.model';

export function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email ?? null,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    language: user.language,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}
