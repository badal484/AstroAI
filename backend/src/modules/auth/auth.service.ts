import mongoose from 'mongoose';
import { AccountStatus, AuthProviderType, type AuthResponse } from '@astroai/shared-types';
import { env } from '../../config/env';
import {
  AccountDeletedError,
  AccountSuspendedError,
  InvalidCredentialsError,
} from '../../shared/errors';
import { signAccessToken } from '../../shared/tokens';
import { userService, toAuthUser, type UserDocument } from '../users';
import { authIdentityRepository } from './authIdentity.repository';
import { userSessionService, type IssuedSession, type SessionMeta } from './session';
import { googleAuthProvider } from './providers/google.provider';
import type { AuthProviderAdapter, VerifiedIdentity } from './providers/authProvider.types';

/**
 * Every supported identity provider is registered here. Adding phone/OTP
 * later means adding one adapter + this one line — nothing below this
 * point (session issuance, user lookup, account-status checks) changes.
 */
const providers: Partial<Record<AuthProviderType, AuthProviderAdapter>> = {
  [AuthProviderType.GOOGLE]: googleAuthProvider,
};

function getProvider(type: AuthProviderType): AuthProviderAdapter {
  const provider = providers[type];
  if (!provider) throw new InvalidCredentialsError(`Unsupported auth provider: ${type}`);
  return provider;
}

function assertActive(user: UserDocument): void {
  if (user.status === AccountStatus.SUSPENDED) throw new AccountSuspendedError();
  if (user.status === AccountStatus.DELETED) throw new AccountDeletedError();
}

async function findOrCreateUserByIdentity(
  provider: AuthProviderType,
  identity: VerifiedIdentity,
): Promise<UserDocument> {
  const existing = await authIdentityRepository.findByProvider(provider, identity.providerId);
  if (existing) {
    return userService.getById(existing.userId.toString());
  }

  const mongoSession = await mongoose.startSession();
  try {
    let created: UserDocument | undefined;
    await mongoSession.withTransaction(async () => {
      const user = await userService.createUser(
        { email: identity.email, name: identity.name, avatarUrl: identity.avatarUrl },
        mongoSession,
      );
      await authIdentityRepository.create(
        user._id.toString(),
        provider,
        identity.providerId,
        mongoSession,
      );
      created = user;
    });
    if (!created) throw new InvalidCredentialsError('Failed to create account');
    return created;
  } catch (error) {
    // Concurrent duplicate sign-in race: another request created the same
    // identity between our findByProvider check and this transaction.
    // Idempotent recovery — return the identity that won, not an error.
    if (isDuplicateKeyError(error)) {
      const winner = await authIdentityRepository.findByProvider(provider, identity.providerId);
      if (winner) return userService.getById(winner.userId.toString());
    }
    throw error;
  } finally {
    await mongoSession.endSession();
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function buildAuthResponse(user: UserDocument, session: IssuedSession): AuthResponse {
  const access = signAccessToken(
    { sub: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_TTL_SECONDS,
  );

  return {
    user: toAuthUser(user),
    tokens: {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt.toISOString(),
    },
  };
}

export const authService = {
  async signIn(
    providerType: AuthProviderType,
    credential: string,
    meta: SessionMeta,
  ): Promise<AuthResponse> {
    const provider = getProvider(providerType);
    const identity = await provider.verify(credential);
    const user = await findOrCreateUserByIdentity(providerType, identity);
    assertActive(user);
    const session = await userSessionService.createSession(user._id.toString(), meta);
    return buildAuthResponse(user, session);
  },

  async refresh(rawRefreshToken: string, meta: SessionMeta): Promise<AuthResponse> {
    const { subjectId, session } = await userSessionService.rotate(rawRefreshToken, meta);
    const user = await userService.getById(subjectId);
    assertActive(user);
    return buildAuthResponse(user, session);
  },

  async logout(rawRefreshToken: string): Promise<void> {
    await userSessionService.revoke(rawRefreshToken);
  },

  async logoutAll(userId: string): Promise<void> {
    await userSessionService.revokeAllForSubject(userId);
  },

  async me(userId: string) {
    const user = await userService.getById(userId);
    assertActive(user);
    return toAuthUser(user);
  },

  async deleteAccount(userId: string): Promise<void> {
    await userService.softDelete(userId);
    await userSessionService.revokeAllForSubject(userId);
  },
};
