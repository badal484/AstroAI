import { z } from 'zod';

/**
 * End-user account lifecycle state (CLAUDE.md §36/§56). Enforced by the
 * backend's authenticate middleware on every request — a suspended or
 * deleted account's tokens are rejected even if still cryptographically
 * valid and unexpired.
 */
export const AccountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

/**
 * Identity providers a user can authenticate with. New providers (e.g.
 * `phone_otp`, `apple`) are added here and to the backend's provider
 * registry without changing the User schema or session/token logic —
 * see ARCHITECTURE.md §14 and CLAUDE.md's "support future authentication
 * providers" requirement.
 */
export const AuthProviderType = {
  GOOGLE: 'google',
  PHONE_OTP: 'phone_otp',
} as const;
export type AuthProviderType = (typeof AuthProviderType)[keyof typeof AuthProviderType];

/** End-user role. Single role today; kept as an enum (not a boolean) so a
 * future distinction (e.g. a human-astrologer account type) doesn't require
 * a schema migration. */
export const UserRole = {
  USER: 'user',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Admin roles (CLAUDE.md §32) — a fixed set for now; the permission each
 * role grants is defined server-side in `modules/admin/rbac.ts` and
 * returned to the client via /admin/auth/me, never re-derived client-side.
 */
export const AdminRole = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS: 'operations',
  SUPPORT: 'support',
  FINANCE: 'finance',
  MARKETING: 'marketing',
  CONTENT: 'content',
  AI_MANAGER: 'ai_manager',
  ANALYST: 'analyst',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

/**
 * Fine-grained admin permissions (CLAUDE.md §32/§34). Every sensitive admin
 * route is guarded by one of these via requirePermission() — the UI uses
 * the same strings only to decide what to render, never as the actual
 * access-control decision (CLAUDE.md §37).
 */
export const AdminPermission = {
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  ADMIN_USERS_MANAGE: 'admin_users:manage',
  AUDIT_LOGS_READ: 'audit_logs:read',
} as const;
export type AdminPermission = (typeof AdminPermission)[keyof typeof AdminPermission];

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  language: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

/** POST /api/v1/auth/google */
export const googleSignInSchema = z.object({
  idToken: z.string().min(1),
});
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;

/** Mobile auth responses always carry both tokens in the body (no browser
 * cookie jar to rely on) — the refresh token is persisted by the client in
 * encrypted storage, never in plain AsyncStorage (CLAUDE.md §36). */
export interface AuthTokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokenPair;
}

/** POST /api/v1/auth/refresh */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/** POST /api/v1/admin/auth/login — admin tokens travel via httpOnly cookies,
 * never in the response body (ARCHITECTURE.md §3/§14). */
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
