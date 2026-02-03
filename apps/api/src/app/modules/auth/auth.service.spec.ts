import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('throws on invalid login', async () => {
    const svc = new AuthService(
      { sign: () => 'x', verify: () => ({}) } as any,
      { findOne: async () => null, save: async (u: any) => u } as any,
    );
    await expect(svc.login('no@no.com', 'password123')).rejects.toBeDefined();
  });
});
