import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './decorators';
import { hasPermission } from './rbac';
import { Permission } from '@ckouetchua-87342/data';
import { PUBLIC_KEY } from './public';

function normalizePath(req: any): string {
  const raw = (req?.path ?? req?.originalUrl ?? '') as string;
  // support global prefix /api if present
  return raw.startsWith('/api') ? raw.slice(4) || '/' : raw;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const path = normalizePath(req);

    // Always allow auth + swagger routes without permission checks
    if (path.startsWith('/auth')) return true;
    if (
      path === '/swagger' ||
      path.startsWith('/swagger/') ||
      path === '/swagger-json' ||
      path.startsWith('/swagger-json') ||
      path.startsWith('/favicon')
    ) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<Permission | undefined>(
      PERMISSION_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // If no permission required, allow (but other auth layers may still run)
    if (!required) return true;

    // IMPORTANT: reads middleware-provided auth user
    const user = req.authUser as { role?: string } | undefined;
    if (!user?.role) throw new ForbiddenException('Missing user role');

    if (!hasPermission(user.role as any, required)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
