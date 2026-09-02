import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Requires real Google Cloud OAuth client IDs — see docs/ENVIRONMENT.md.
 * Configuration is a no-op with placeholder values (calls will fail with a
 * clear provider error, not silently "succeed" — CLAUDE.md §51 forbids
 * faking a provider response).
 */
export function configureGoogleSignIn(webClientId: string): void {
  GoogleSignin.configure({ webClientId, offlineAccess: false });
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Sign-in was cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

/** Resolves the Google ID token to hand to POST /api/v1/auth/google, or
 * throws GoogleSignInCancelledError if the user dismissed the picker. */
export async function signInWithGoogle(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new GoogleSignInCancelledError();
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token');
  }

  return idToken;
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  if (error instanceof GoogleSignInCancelledError) return true;
  return isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED;
}
