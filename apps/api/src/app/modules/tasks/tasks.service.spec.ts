import { TasksService } from './tasks.service';
import { In } from 'typeorm';

describe('TasksService tenant scoping', () => {
  it('listAccessible uses accessibleOrgIds scope', async () => {
    const repo: any = {
      find: jest.fn(async (q: any) => {
        const ids = (q.where.orgId as any)._value ?? [];
        const all = [
          { id: 't1', orgId: 'P' },
          { id: 't2', orgId: 'C1' },
          { id: 't3', orgId: 'X' },
        ];
        return all.filter((t) => ids.includes(t.orgId));
      }),
      create: (x: any) => x,
      save: async (x: any) => x,
      findOne: async () => null,
      delete: async () => ({ ok: true }),
    };

    const svc = new TasksService(repo);

    const user: any = {
      userId: 'u',
      email: 'e',
      orgId: 'P',
      role: 'VIEWER',
      accessibleOrgIds: ['P', 'C1'],
    };
    const res = await svc.listAccessible(user);

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orgId: In(['P', 'C1']) } }),
    );
    expect(res.map((x: any) => x.id)).toEqual(['t1', 't2']);
  });
});
