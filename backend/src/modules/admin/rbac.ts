import { AdminPermission, AdminRole } from '@astroai/shared-types';

/**
 * Role → permission map. Single source of truth for what each admin role can do.
 * Enforced server-side by requirePermission middleware on all admin routes.
 */
const ALL_PERMISSIONS = Object.values(AdminPermission);

export const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: ALL_PERMISSIONS,

  [AdminRole.OPERATIONS]: [
    AdminPermission.USERS_READ,
    AdminPermission.USERS_MANAGE,
    AdminPermission.WALLET_READ,
    AdminPermission.PAYMENTS_READ,
    AdminPermission.VOICE_READ,
    AdminPermission.VOICE_MANAGE,
    AdminPermission.REPORTS_READ,
    AdminPermission.REPORTS_MANAGE,
    AdminPermission.NOTIFICATIONS_READ,
    AdminPermission.NOTIFICATIONS_MANAGE,
    AdminPermission.PROMOTIONS_READ,
    AdminPermission.PROMOTIONS_MANAGE,
    AdminPermission.SUPPORT_READ,
    AdminPermission.SUPPORT_MANAGE,
    AdminPermission.FEATURE_FLAGS_READ,
    AdminPermission.AUDIT_LOGS_READ,
  ],

  [AdminRole.SUPPORT]: [
    AdminPermission.USERS_READ,
    AdminPermission.WALLET_READ,
    AdminPermission.PAYMENTS_READ,
    AdminPermission.VOICE_READ,
    AdminPermission.REPORTS_READ,
    AdminPermission.NOTIFICATIONS_READ,
    AdminPermission.PROMOTIONS_READ,
    AdminPermission.SUPPORT_READ,
    AdminPermission.SUPPORT_MANAGE,
    AdminPermission.AUDIT_LOGS_READ,
  ],

  [AdminRole.FINANCE]: [
    AdminPermission.WALLET_READ,
    AdminPermission.WALLET_MANAGE,
    AdminPermission.PRICING_READ,
    AdminPermission.PRICING_MANAGE,
    AdminPermission.PAYMENTS_READ,
    AdminPermission.PAYMENTS_MANAGE,
    AdminPermission.USERS_READ,
    AdminPermission.VOICE_READ,
    AdminPermission.REPORTS_READ,
    AdminPermission.PROMOTIONS_READ,
    AdminPermission.PROMOTIONS_MANAGE,
    AdminPermission.ANALYTICS_READ,
    AdminPermission.AUDIT_LOGS_READ,
  ],

  [AdminRole.MARKETING]: [
    AdminPermission.USERS_READ,
    AdminPermission.PRICING_READ,
    AdminPermission.NOTIFICATIONS_READ,
    AdminPermission.NOTIFICATIONS_MANAGE,
    AdminPermission.PROMOTIONS_READ,
    AdminPermission.PROMOTIONS_MANAGE,
    AdminPermission.CONTENT_READ,
    AdminPermission.ANALYTICS_READ,
  ],

  [AdminRole.CONTENT]: [
    AdminPermission.CONTENT_READ,
    AdminPermission.CONTENT_MANAGE,
    AdminPermission.NOTIFICATIONS_READ,
    AdminPermission.NOTIFICATIONS_MANAGE,
    AdminPermission.PROMOTIONS_READ,
    AdminPermission.ASTROLOGY_READ,
  ],

  [AdminRole.AI_MANAGER]: [
    AdminPermission.AI_READ,
    AdminPermission.AI_MANAGE,
    AdminPermission.VOICE_READ,
    AdminPermission.VOICE_MANAGE,
    AdminPermission.REPORTS_READ,
    AdminPermission.REPORTS_MANAGE,
    AdminPermission.ASTROLOGY_READ,
    AdminPermission.ASTROLOGY_MANAGE,
    AdminPermission.FEATURE_FLAGS_READ,
    AdminPermission.FEATURE_FLAGS_MANAGE,
    AdminPermission.ANALYTICS_READ,
  ],

  [AdminRole.ANALYST]: [
    AdminPermission.USERS_READ,
    AdminPermission.WALLET_READ,
    AdminPermission.PRICING_READ,
    AdminPermission.PAYMENTS_READ,
    AdminPermission.VOICE_READ,
    AdminPermission.REPORTS_READ,
    AdminPermission.NOTIFICATIONS_READ,
    AdminPermission.PROMOTIONS_READ,
    AdminPermission.AI_READ,
    AdminPermission.ASTROLOGY_READ,
    AdminPermission.CONTENT_READ,
    AdminPermission.FEATURE_FLAGS_READ,
    AdminPermission.ANALYTICS_READ,
    AdminPermission.SUPPORT_READ,
    AdminPermission.AUDIT_LOGS_READ,
  ],
};

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return rolePermissions[role] ?? [];
}
