import type { AuthProviderType } from '@astroai/shared-types';

export interface VerifiedIdentity {
  providerId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Every identity provider (Google today; phone/OTP, Apple, ... later)
 * implements this same interface. `auth.service.ts` depends only on this
 * abstraction — adding a provider means adding an adapter here and one
 * route, never touching session/token/user logic (CLAUDE.md's "support
 * future authentication providers without rewriting the user system").
 */
export interface AuthProviderAdapter {
  readonly type: AuthProviderType;
  verify(credential: string): Promise<VerifiedIdentity>;
}
