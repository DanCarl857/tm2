import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../entities/organization.entity';

function bearerToken(req: any): string | null {
  const h = req.headers?.authorization;
  if (!h || typeof h !== 'string') return null;
  const [t, v] = h.split(' ');
  if (t !== 'Bearer' || !v) return null;
  return v.trim();
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private accessSecret =
    process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me';

  constructor(
    private jwt: JwtService,
    @InjectRepository(OrganizationEntity)
    private orgs: Repository<OrganizationEntity>,
  ) {}

  async use(req: any, _res: any, next: (err?: any) => void) {
    const originalUrl = String(req.originalUrl ?? '').split('?')[0];
    const baseUrl = String(req.baseUrl ?? '').split('?')[0];

    console.log('MW CHECK', { originalUrl, baseUrl, method: req.method });

    // Allow swagger + auth routes WITHOUT tenant/JWT
    if (
      originalUrl.startsWith('/auth') ||
      baseUrl.startsWith('/auth') ||
      originalUrl === '/swagger' ||
      originalUrl.startsWith('/swagger/') ||
      originalUrl === '/swagger-json' ||
      originalUrl.startsWith('/swagger-json') ||
      originalUrl.startsWith('/favicon')
    ) {
      return next();
    }

    const token = bearerToken(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.accessSecret });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const userId = payload.sub as string | undefined;
    const email = payload.email as string | undefined;
    const orgId = payload.orgId as string | undefined;
    const role = payload.role as 'OWNER' | 'ADMIN' | 'VIEWER' | undefined;

    if (!userId || !email || !orgId || !role)
      throw new UnauthorizedException('Malformed token');

    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new ForbiddenException('Org not found');

    let accessibleOrgIds: string[] = [];
    let isParentOrg = false;

    if (org.parentOrgId) {
      accessibleOrgIds = [org.id];
      isParentOrg = false;
    } else {
      const children = await this.orgs.find({ where: { parentOrgId: org.id } });
      accessibleOrgIds = [org.id, ...children.map((c) => c.id)];
      isParentOrg = true;
    }

    req.authUser = { userId, email, orgId, role, accessibleOrgIds };
    req.tenant = { orgId, accessibleOrgIds, isParentOrg };

    return next();
  }
}
