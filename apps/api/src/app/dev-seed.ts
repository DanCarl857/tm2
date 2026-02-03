import { DataSource } from 'typeorm';
import { OrganizationEntity } from './entities/organization.entity';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

export async function devSeed(ds: DataSource) {
  const orgRepo = ds.getRepository(OrganizationEntity);
  const userRepo = ds.getRepository(UserEntity);

  const existing = await userRepo.findOne({
    where: { email: 'owner@demo.com' },
  });
  if (existing) return;

  const parent = await orgRepo.save(
    orgRepo.create({ name: 'Demo Parent Org', parentOrgId: null }),
  );
  const child = await orgRepo.save(
    orgRepo.create({ name: 'Demo Child Org', parentOrgId: parent.id }),
  );

  await userRepo.save(
    userRepo.create({
      email: 'owner@demo.com',
      passwordHash: await bcrypt.hash('password123', 10),
      orgId: child.id, // seed user in CHILD; scope will be only child
      role: 'OWNER',
      refreshTokenHash: null,
    }),
  );

  await userRepo.save(
    userRepo.create({
      email: 'admin-parent@demo.com',
      passwordHash: await bcrypt.hash('password123', 10),
      orgId: parent.id, // this user will see parent+children tasks
      role: 'ADMIN',
      refreshTokenHash: null,
    }),
  );

  await userRepo.save(
    userRepo.create({
      email: 'viewer-child@demo.com',
      passwordHash: await bcrypt.hash('password123', 10),
      orgId: child.id, // viewer in CHILD
      role: 'VIEWER',
      refreshTokenHash: null,
    }),
  );
}
