import { describe, expect, it } from 'vitest';
import { AdminPermission, AdminRole } from '@astroai/shared-types';
import { permissionsForRole } from '../../src/modules/admin/rbac';

describe('rbac', () => {
  it('grants super_admin every defined permission', () => {
    const granted = permissionsForRole(AdminRole.SUPER_ADMIN);
    for (const permission of Object.values(AdminPermission)) {
      expect(granted).toContain(permission);
    }
  });

  it('does not grant support the users:manage permission', () => {
    expect(permissionsForRole(AdminRole.SUPPORT)).not.toContain(AdminPermission.USERS_MANAGE);
    expect(permissionsForRole(AdminRole.SUPPORT)).toContain(AdminPermission.USERS_READ);
  });

  it('grants operations both read and manage on users', () => {
    const granted = permissionsForRole(AdminRole.OPERATIONS);
    expect(granted).toContain(AdminPermission.USERS_READ);
    expect(granted).toContain(AdminPermission.USERS_MANAGE);
  });

  it('every role has a defined (possibly empty) permission list', () => {
    for (const role of Object.values(AdminRole)) {
      expect(Array.isArray(permissionsForRole(role))).toBe(true);
    }
  });
});
