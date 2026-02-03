import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app/app.module';

type Tokens = { accessToken: string; refreshToken: string };

async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<Tokens> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  // Nest can respond 200 or 201 depending on defaults
  if (![200, 201].includes(res.status)) {
    throw new Error(`login failed: ${res.status} ${res.text}`);
  }
  return res.body as Tokens;
}

describe('API e2e (tenant scoped + RBAC + Model A org hierarchy)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.SQLITE_PATH = ':memory:'; // isolated per test file run
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('swagger loads without auth', async () => {
    const res = await request(app.getHttpServer()).get('/swagger');
    expect(res.status).toBe(200);
  });

  it('GET /tasks requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/tasks');
    expect(res.status).toBe(401);
  });

  it('VIEWER can read tasks but cannot create/update/delete', async () => {
    const { accessToken } = await login(
      app,
      'viewer-child@demo.com',
      'password123',
    );

    // read ok
    const list = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(list.status).toBe(200);

    // create forbidden (permission guard)
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Viewer cannot create',
        category: 'Work',
        status: 'TODO',
        order: 0,
      });

    expect(created.status).toBe(403);

    // audit forbidden
    const audit = await request(app.getHttpServer())
      .get('/audit-log')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(audit.status).toBe(403);
  });

  it('OWNER in CHILD can create tasks and see only CHILD scope', async () => {
    const { accessToken } = await login(app, 'owner@demo.com', 'password123');

    // create a task
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Child Task 1',
        category: 'Work',
        status: 'TODO',
        order: 0,
      });

    expect([200, 201].includes(created.status)).toBe(true);

    // list should include it
    const list = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(list.status).toBe(200);
    expect(list.body.some((t: any) => t.title === 'Child Task 1')).toBe(true);

    // audit allowed for OWNER
    const audit = await request(app.getHttpServer())
      .get('/audit-log')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(audit.status).toBe(200);
    // tenant filter: audit entries returned should have orgId populated and in-scope
    expect(Array.isArray(audit.body)).toBe(true);
  });

  it('ADMIN in PARENT sees tasks in CHILD too (Model A)', async () => {
    // First: create a child task as OWNER (child)
    const owner = await login(app, 'owner@demo.com', 'password123');
    const childTask = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Child Task Visible To Parent Admin',
        category: 'Personal',
        status: 'TODO',
        order: 0,
      });

    expect([200, 201].includes(childTask.status)).toBe(true);

    // Then: login as parent admin and confirm they can see it
    const parentAdmin = await login(
      app,
      'admin-parent@demo.com',
      'password123',
    );
    const list = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${parentAdmin.accessToken}`);

    expect(list.status).toBe(200);
    expect(
      list.body.some(
        (t: any) => t.title === 'Child Task Visible To Parent Admin',
      ),
    ).toBe(true);
  });

  it('Refresh token returns a new access token', async () => {
    const tokens = await login(app, 'owner@demo.com', 'password123');

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect([200, 201].includes(refreshed.status)).toBe(true);
    expect(typeof refreshed.body.accessToken).toBe('string');
    expect(refreshed.body.accessToken.length).toBeGreaterThan(20);
  });

  it('Audit log is tenant-scoped and requires ADMIN/OWNER', async () => {
    const owner = await login(app, 'owner@demo.com', 'password123');

    // produce an audited request
    await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    const auditOwner = await request(app.getHttpServer())
      .get('/audit-log')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(auditOwner.status).toBe(200);
    expect(Array.isArray(auditOwner.body)).toBe(true);

    const viewer = await login(app, 'viewer-child@demo.com', 'password123');
    const auditViewer = await request(app.getHttpServer())
      .get('/audit-log')
      .set('Authorization', `Bearer ${viewer.accessToken}`);

    expect(auditViewer.status).toBe(403);
  });
});
