import { beforeEach, describe, expect, it } from 'vitest';
import { AdminPermission, AdminRole } from '@astroai/shared-types';
import { useAdminAuthStore } from '../src/stores/adminAuthStore';

const admin = {
  id: 'admin-1',
  email: 'admin@astroai.test',
  name: 'Test Admin',
  role: AdminRole.SUPPORT,
  permissions: [AdminPermission.USERS_READ],
};

beforeEach(() => {
  useAdminAuthStore.setState({ status: 'idle', admin: null });
});

describe('adminAuthStore', () => {
  it('starts idle with no admin', () => {
    const state = useAdminAuthStore.getState();
    expect(state.status).toBe('idle');
    expect(state.admin).toBeNull();
  });

  it('setAuthenticated stores the admin and flips status', () => {
    useAdminAuthStore.getState().setAuthenticated(admin);
    const state = useAdminAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.admin).toEqual(admin);
  });

  it('setUnauthenticated clears the admin', () => {
    useAdminAuthStore.getState().setAuthenticated(admin);
    useAdminAuthStore.getState().setUnauthenticated();
    const state = useAdminAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.admin).toBeNull();
  });

  it('hasPermission reflects the current admin permissions', () => {
    useAdminAuthStore.getState().setAuthenticated(admin);
    expect(useAdminAuthStore.getState().hasPermission(AdminPermission.USERS_READ)).toBe(true);
    expect(useAdminAuthStore.getState().hasPermission(AdminPermission.USERS_MANAGE)).toBe(false);
  });

  it('hasPermission is false with no admin signed in', () => {
    expect(useAdminAuthStore.getState().hasPermission(AdminPermission.USERS_READ)).toBe(false);
  });
});
