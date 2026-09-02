import { create } from 'zustand';
import type { AdminPermission, AdminSessionUser } from '@astroai/shared-types';

export type AdminAuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AdminAuthState {
  status: AdminAuthStatus;
  admin: AdminSessionUser | null;
  setAuthenticated: (admin: AdminSessionUser) => void;
  setUnauthenticated: () => void;
  setLoading: () => void;
  hasPermission: (permission: AdminPermission) => boolean;
}

/**
 * Client-side mirror of the admin session. The actual session lives in
 * httpOnly cookies the server manages — this store just reflects the last
 * known result of asking the server "who am I" (GET /admin/auth/me), so
 * the UI can render without an authoritative decision ever being made in
 * the browser (ARCHITECTURE.md §3/§37 — the backend is still the
 * authority for every real request, this is UX state only).
 */
export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  status: 'idle',
  admin: null,
  setAuthenticated: (admin) => set({ status: 'authenticated', admin }),
  setUnauthenticated: () => set({ status: 'unauthenticated', admin: null }),
  setLoading: () => set({ status: 'loading' }),
  hasPermission: (permission) => get().admin?.permissions.includes(permission) ?? false,
}));
