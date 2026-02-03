import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from './request-types';

export function requireUser(user: AuthUser | undefined): AuthUser {
  if (!user) throw new ForbiddenException('Missing auth user');
  return user;
}

export function requireScope(user: AuthUser): string[] {
  if (!user.accessibleOrgIds || user.accessibleOrgIds.length === 0) {
    throw new ForbiddenException('Tenant scope missing');
  }
  return user.accessibleOrgIds;
}
