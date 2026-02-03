import { hasPermission, roleInherits } from './rbac';

describe('rbac', () => {
  it('role inheritance', () => {
    expect(roleInherits('OWNER', 'ADMIN')).toBe(true);
    expect(roleInherits('ADMIN', 'OWNER')).toBe(false);
    expect(roleInherits('VIEWER', 'VIEWER')).toBe(true);
  });

  it('permissions', () => {
    expect(hasPermission('VIEWER', 'task:read')).toBe(true);
    expect(hasPermission('VIEWER', 'task:create')).toBe(false);
    expect(hasPermission('ADMIN', 'task:create')).toBe(true);
    expect(hasPermission('OWNER', 'audit:read')).toBe(true);
  });
});
