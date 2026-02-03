import { Permission } from '@ckouetchua-87342/data';
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

export function RequirePermission(permission: Permission) {
  return SetMetadata(PERMISSION_KEY, permission);
}
