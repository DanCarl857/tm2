import { DataSource } from 'typeorm';
import { OrganizationEntity } from './entities/organization.entity';
import { UserEntity } from './entities/user.entity';
import { TaskEntity } from './entities/task.entity';
import * as bcrypt from 'bcryptjs';

async function upsertOrg(
  repo: ReturnType<DataSource['getRepository']>,
  row: Partial<OrganizationEntity>,
) {
  const found = await (repo as any).findOne({ where: { name: row.name } });
  if (found) return found;
  return (repo as any).save((repo as any).create(row));
}

async function upsertUser(
  repo: ReturnType<DataSource['getRepository']>,
  row: Partial<UserEntity>,
) {
  const found = await (repo as any).findOne({ where: { email: row.email } });
  if (found) return found;
  return (repo as any).save((repo as any).create(row));
}

async function upsertTask(
  repo: ReturnType<DataSource['getRepository']>,
  row: Partial<TaskEntity> & { orgId: string; title: string },
) {
  const found = await (repo as any).findOne({
    where: { orgId: row.orgId, title: row.title },
  });
  if (found) return found;
  return (repo as any).save((repo as any).create(row));
}

function datePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function devSeed(ds: DataSource) {
  const orgRepo = ds.getRepository(OrganizationEntity);
  const userRepo = ds.getRepository(UserEntity);
  const taskRepo = ds.getRepository(TaskEntity);

  // avoid reseeding if already seeded
  const already = await userRepo.findOne({
    where: { email: 'owner@alpha-a.com' },
  });
  if (already) return;

  const pw = await bcrypt.hash('password123', 10);

  // ----------------------------
  // ORGS (2-level hierarchy)
  // ----------------------------
  const alpha = await upsertOrg(orgRepo, { name: 'Alpha (Parent)' });
  const alphaA = await upsertOrg(orgRepo, {
    name: 'Alpha A (Child)',
    parentOrgId: alpha.id,
  });
  const alphaB = await upsertOrg(orgRepo, {
    name: 'Alpha B (Child)',
    parentOrgId: alpha.id,
  });
  const alphaC = await upsertOrg(orgRepo, {
    name: 'Alpha C (Child)',
    parentOrgId: alpha.id,
  });

  const beta = await upsertOrg(orgRepo, { name: 'Beta (Parent)' });
  const betaA = await upsertOrg(orgRepo, {
    name: 'Beta A (Child)',
    parentOrgId: beta.id,
  });
  const betaB = await upsertOrg(orgRepo, {
    name: 'Beta B (Child)',
    parentOrgId: beta.id,
  });

  const gamma = await upsertOrg(orgRepo, { name: 'Gamma (Parent)' });
  const gammaA = await upsertOrg(orgRepo, {
    name: 'Gamma A (Child)',
    parentOrgId: gamma.id,
  });
  const gammaB = await upsertOrg(orgRepo, {
    name: 'Gamma B (Child)',
    parentOrgId: gamma.id,
  });

  // ----------------------------
  // USERS (create + keep references for createdByUserId)
  // ----------------------------
  const alphaA_owner = await upsertUser(userRepo, {
    email: 'owner@alpha-a.com',
    passwordHash: pw,
    orgId: alphaA.id,
    role: 'OWNER',
  });
  const alphaA_admin = await upsertUser(userRepo, {
    email: 'admin@alpha-a.com',
    passwordHash: pw,
    orgId: alphaA.id,
    role: 'ADMIN',
  });
  await upsertUser(userRepo, {
    email: 'viewer@alpha-a.com',
    passwordHash: pw,
    orgId: alphaA.id,
    role: 'VIEWER',
  });

  const alphaB_owner = await upsertUser(userRepo, {
    email: 'owner@alpha-b.com',
    passwordHash: pw,
    orgId: alphaB.id,
    role: 'OWNER',
  });
  await upsertUser(userRepo, {
    email: 'admin@alpha-b.com',
    passwordHash: pw,
    orgId: alphaB.id,
    role: 'ADMIN',
  });
  await upsertUser(userRepo, {
    email: 'viewer@alpha-b.com',
    passwordHash: pw,
    orgId: alphaB.id,
    role: 'VIEWER',
  });

  const alpha_parent_admin = await upsertUser(userRepo, {
    email: 'admin@alpha-parent.com',
    passwordHash: pw,
    orgId: alpha.id,
    role: 'ADMIN',
  });

  const betaA_owner = await upsertUser(userRepo, {
    email: 'owner@beta-a.com',
    passwordHash: pw,
    orgId: betaA.id,
    role: 'OWNER',
  });
  await upsertUser(userRepo, {
    email: 'admin@beta-a.com',
    passwordHash: pw,
    orgId: betaA.id,
    role: 'ADMIN',
  });
  await upsertUser(userRepo, {
    email: 'viewer@beta-a.com',
    passwordHash: pw,
    orgId: betaA.id,
    role: 'VIEWER',
  });

  const beta_parent_admin = await upsertUser(userRepo, {
    email: 'admin@beta-parent.com',
    passwordHash: pw,
    orgId: beta.id,
    role: 'ADMIN',
  });

  const gammaA_owner = await upsertUser(userRepo, {
    email: 'owner@gamma-a.com',
    passwordHash: pw,
    orgId: gammaA.id,
    role: 'OWNER',
  });
  await upsertUser(userRepo, {
    email: 'admin@gamma-a.com',
    passwordHash: pw,
    orgId: gammaA.id,
    role: 'ADMIN',
  });
  await upsertUser(userRepo, {
    email: 'viewer@gamma-a.com',
    passwordHash: pw,
    orgId: gammaA.id,
    role: 'VIEWER',
  });

  const gamma_parent_admin = await upsertUser(userRepo, {
    email: 'admin@gamma-parent.com',
    passwordHash: pw,
    orgId: gamma.id,
    role: 'ADMIN',
  });

  // ----------------------------
  // TASKS 
  // ----------------------------
  const taskSeeds: Array<
    Partial<TaskEntity> & { orgId: string; title: string }
  > = [
    // Alpha A (created by Alpha A owner/admin)
    {
      orgId: alphaA.id,
      createdByUserId: alphaA_owner.id,
      title: 'Alpha A: Pay invoices',
      category: 'Work',
      description: null,
      status: 'TODO',
      order: 0,
      dueDate: datePlusDays(2),
    },
    {
      orgId: alphaA.id,
      createdByUserId: alphaA_admin.id,
      title: 'Alpha A: Gym',
      category: 'Personal',
      description: null,
      status: 'IN_PROGRESS',
      order: 0,
      dueDate: datePlusDays(5),
    },
    {
      orgId: alphaA.id,
      createdByUserId: alphaA_owner.id,
      title: 'Alpha A: File reports',
      category: 'Work',
      description: null,
      status: 'DONE',
      order: 0,
      dueDate: null,
    },

    // Alpha B (created by Alpha B owner)
    {
      orgId: alphaB.id,
      createdByUserId: alphaB_owner.id,
      title: 'Alpha B: Onboard user',
      category: 'Work',
      description: null,
      status: 'TODO',
      order: 0,
      dueDate: datePlusDays(3),
    },
    {
      orgId: alphaB.id,
      createdByUserId: alphaB_owner.id,
      title: 'Alpha B: Update docs',
      category: 'Work',
      description: null,
      status: 'IN_PROGRESS',
      order: 0,
      dueDate: null,
    },

    // Alpha C (no dedicated users in this seed; created by Alpha parent admin)
    {
      orgId: alphaC.id,
      createdByUserId: alpha_parent_admin.id,
      title: 'Alpha C: Personal errand',
      category: 'Personal',
      description: null,
      status: 'TODO',
      order: 0,
      dueDate: datePlusDays(7),
    },

    // Beta A (created by Beta A owner)
    {
      orgId: betaA.id,
      createdByUserId: betaA_owner.id,
      title: 'Beta A: Tenant isolated task',
      category: 'Work',
      description: null,
      status: 'TODO',
      order: 0,
      dueDate: datePlusDays(1),
    },
    {
      orgId: betaA.id,
      createdByUserId: betaA_owner.id,
      title: 'Beta A: Clean inbox',
      category: 'Work',
      description: null,
      status: 'DONE',
      order: 0,
      dueDate: null,
    },

    // Beta B (no dedicated users in this seed; created by Beta parent admin)
    {
      orgId: betaB.id,
      createdByUserId: beta_parent_admin.id,
      title: 'Beta B: Plan sprint',
      category: 'Work',
      description: null,
      status: 'IN_PROGRESS',
      order: 0,
      dueDate: datePlusDays(4),
    },

    // Gamma A (created by Gamma A owner)
    {
      orgId: gammaA.id,
      createdByUserId: gammaA_owner.id,
      title: 'Gamma A: Call client',
      category: 'Work',
      description: null,
      status: 'TODO',
      order: 0,
      dueDate: datePlusDays(2),
    },

    // Gamma B (no dedicated users in this seed; created by Gamma parent admin)
    {
      orgId: gammaB.id,
      createdByUserId: gamma_parent_admin.id,
      title: 'Gamma B: Personal reading',
      category: 'Personal',
      description: null,
      status: 'DONE',
      order: 0,
      dueDate: null,
    },
  ];

  for (const t of taskSeeds) {
    await upsertTask(taskRepo, t);
  }

  // Normalize ordering per org/status
  const allTasks = await taskRepo.find();
  const grouped = new Map<string, TaskEntity[]>();
  for (const t of allTasks) {
    const key = `${t.orgId}::${t.status}`;
    const list = grouped.get(key) ?? [];
    list.push(t);
    grouped.set(key, list);
  }
  for (const [, list] of grouped) {
    list.sort((a, b) => a.title.localeCompare(b.title));
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) list[i].order = i;
    }
    await taskRepo.save(list);
  }

  console.log('Dev seed complete.');
  console.log('Password for all demo users: password123');
  console.log('--- DEMO LOGINS ---');
  console.log(
    'Alpha A: owner@alpha-a.com | admin@alpha-a.com | viewer@alpha-a.com',
  );
  console.log(
    'Alpha B: owner@alpha-b.com | admin@alpha-b.com | viewer@alpha-b.com',
  );
  console.log(
    'Alpha parent admin (Model A): admin@alpha-parent.com (should see Alpha A/B/C tasks)',
  );
  console.log(
    'Beta A: owner@beta-a.com | admin@beta-a.com | viewer@beta-a.com',
  );
  console.log('Beta parent admin: admin@beta-parent.com');
  console.log(
    'Gamma A: owner@gamma-a.com | admin@gamma-a.com | viewer@gamma-a.com',
  );
  console.log('Gamma parent admin: admin@gamma-parent.com');
}
