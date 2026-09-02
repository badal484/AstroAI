import { create } from 'zustand';
import type { AuthUser } from '@astroai/shared-types';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** In memory only — never persisted. Re-derived from the refresh token
   * (held in encrypted storage) on every cold start. */
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  setLoading: () => void;
  setUnauthenticated: () => void;
}

/**
 * Client-side mirror of the session, analogous to the admin app's
 * adminAuthStore. Every real authorization decision still happens on the
 * backend (ARCHITECTURE.md §37) — this only drives which navigator
 * (Auth vs App) renders and the "authentication loading state" shown while
 * the initial silent-refresh bootstrap (see App.tsx) is in flight.
 */
export const useAuthStore = create<AuthState>(set => ({
  status: 'idle',
  user: null,
  accessToken: null,
  setSession: (user, accessToken) =>
    set({ status: 'authenticated', user, accessToken }),
  setLoading: () => set({ status: 'loading' }),
  setUnauthenticated: () =>
    set({ status: 'unauthenticated', user: null, accessToken: null }),
}));
