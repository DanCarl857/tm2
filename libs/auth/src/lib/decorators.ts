import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@ckouetchua-87342/data';

export const PERMISSION_KEY = 'required_permission';

export function RequirePermission(permission: Permission) {
  return SetMetadata(PERMISSION_KEY, permission);
}
