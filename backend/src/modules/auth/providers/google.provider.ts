import { OAuth2Client } from 'google-auth-library';
import { AuthProviderType } from '@astroai/shared-types';
import { env } from '../../../config/env';
import { InvalidCredentialsError } from '../../../shared/errors';
import type { AuthProviderAdapter, VerifiedIdentity } from './authProvider.types';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google Sign-In ID token. `verifyIdToken` checks the JWT
 * signature against Google's published JWKS, and the issuer/audience/
 * expiry claims — this never trusts a client-asserted identity without
 * cryptographic proof.
 */
export const googleAuthProvider: AuthProviderAdapter = {
  type: AuthProviderType.GOOGLE,

  async verify(idToken: string): Promise<VerifiedIdentity> {
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    } catch {
      throw new InvalidCredentialsError('Invalid Google credential');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new InvalidCredentialsError('Invalid Google credential');
    }

    return {
      providerId: payload.sub,
      email: payload.email ?? null,
      name: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    };
  },
};
