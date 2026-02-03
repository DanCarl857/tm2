import { Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '@ckouetchua-87342/auth';
import { AuditInterceptor } from './audit.interceptor';
import { AuditStore } from './audit.store';
import { requireUser, requireScope } from '../../common/tenant';

@ApiTags('audit')
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@Controller('/audit-log')
export class AuditController {
  constructor(private store: AuditStore) {}

  @RequirePermission('audit:read')
  @Get()
  list(@Req() req: any) {
    const user = requireUser(req.authUser);
    const scope = requireScope(user);
    return this.store
      .list()
      .filter((l) => (l.orgId ? scope.includes(l.orgId) : false));
  }
}
