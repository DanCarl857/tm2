import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@ckouetchua-87342/data';
import { PERMISSION_KEY } from './decorators';
import { hasPermission } from './rbac';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission | undefined>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;

    const req = ctx.switchToHttp().getRequest();
    // IMPORTANT: reads middleware-provided auth user
    const user = req.authUser as { role?: string } | undefined;
    if (!user?.role) throw new ForbiddenException('Missing user role');

    if (!hasPermission(user.role as any, required)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
