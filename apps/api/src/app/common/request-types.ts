export type AuthUser = {
  userId: string;
  email: string;
  orgId: string;
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  accessibleOrgIds: string[];
};

export type TenantContext = {
  orgId: string;
  accessibleOrgIds: string[];
  isParentOrg: boolean;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      tenant?: TenantContext;
    }
  }
}
