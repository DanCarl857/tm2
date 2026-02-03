import { TenantContextMiddleware } from './tenant-context.middleware';

describe('TenantContextMiddleware', () => {
  it('allows swagger without auth', async () => {
    const mw = new TenantContextMiddleware(
      { verify: () => ({}) } as any,
      { findOne: async () => null, find: async () => [] } as any,
    );
    const req: any = { path: '/swagger' };
    const next = jest.fn();
    await mw.use(req, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
