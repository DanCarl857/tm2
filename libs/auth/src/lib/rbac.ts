import type { Permission, Role } from '@ckouetchua-87342/data';

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  ADMIN: 2,
  OWNER: 3,
};

const PERMISSIONS_BY_MIN_ROLE: Record<Permission, Role> = {
  'task:read': 'VIEWER',
  'task:create': 'ADMIN',
  'task:update': 'ADMIN',
  'task:delete': 'ADMIN',
  'audit:read': 'ADMIN',
};

export function roleInherits(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const minRole = PERMISSIONS_BY_MIN_ROLE[permission];
  return roleInherits(role, minRole);
}
