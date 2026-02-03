import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { AuditStore } from './audit.store';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private store: AuditStore) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.authUser as any | undefined;

    const method = req.method;
    const path = req.originalUrl ?? req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const entry = {
            id: randomUUID(),
            at: new Date().toISOString(),
            userId: user?.userId ?? null,
            orgId: user?.orgId ?? null,
            method,
            path,
            action: `${method} ${path}`,
            allowed: true,
          };
          // eslint-disable-next-line no-console
          console.log('[AUDIT]', entry);
          this.store.add(entry);
        },
        error: (err) => {
          const entry = {
            id: randomUUID(),
            at: new Date().toISOString(),
            userId: user?.userId ?? null,
            orgId: user?.orgId ?? null,
            method,
            path,
            action: `${method} ${path}`,
            allowed: false,
            reason: err?.message ?? 'error',
          };
          // eslint-disable-next-line no-console
          console.log('[AUDIT]', entry);
          this.store.add(entry);
        },
      }),
    );
  }
}
