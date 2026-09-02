import { AdminPermission, AdminRole } from '@astroai/shared-types';

/**
 * Role → permission map (CLAUDE.md §32). This is the single source of
 * truth for what each admin role can do; the admin UI's conditional
 * rendering is a convenience derived from /admin/auth/me, never the
 * authority (CLAUDE.md §37 — every route is enforced server-side by
 * requirePermission below regardless of what the client sends).
 *
 * Only permissions for what's actually implemented today are assigned.
 * Future modules (wallet, pricing, AI config, ...) add their own
 * AdminPermission values and extend this map — the RBAC mechanism itself
 * doesn't change.
 */
const ALL_PERMISSIONS = Object.values(AdminPermission);

export const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: ALL_PERMISSIONS,
  [AdminRole.OPERATIONS]: [AdminPermission.USERS_READ, AdminPermission.USERS_MANAGE],
  [AdminRole.SUPPORT]: [AdminPermission.USERS_READ],
  [AdminRole.FINANCE]: [],
  [AdminRole.MARKETING]: [],
  [AdminRole.CONTENT]: [],
  [AdminRole.AI_MANAGER]: [],
  [AdminRole.ANALYST]: [AdminPermission.USERS_READ, AdminPermission.AUDIT_LOGS_READ],
};

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return rolePermissions[role] ?? [];
}
