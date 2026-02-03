import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TaskEntity } from '../../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from '@ckouetchua-87342/data';
import type { AuthUser } from '../../common/request-types';
import { requireUser, requireScope } from '../../common/tenant';

function canWrite(role: AuthUser['role']) {
  return role === 'OWNER' || role === 'ADMIN';
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private tasks: Repository<TaskEntity>,
  ) {}

  async create(userMaybe: AuthUser | undefined, dto: CreateTaskDto) {
    const user = requireUser(userMaybe);
    if (!canWrite(user.role))
      throw new ForbiddenException('Role cannot create tasks');

    const now = new Date().toISOString();
    const t = this.tasks.create({
      orgId: user.orgId, // safe default: create in home org
      createdByUserId: user.userId,
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category,
      status: dto.status,
      order: dto.order,
      createdAt: now,
      updatedAt: now,
    });

    return this.tasks.save(t);
  }

  async listAccessible(userMaybe: AuthUser | undefined) {
    const user = requireUser(userMaybe);
    const scope = requireScope(user);

    return this.tasks.find({
      where: { orgId: In(scope) },
      order: { status: 'ASC', order: 'ASC', updatedAt: 'DESC' } as any,
    });
  }

  async update(
    userMaybe: AuthUser | undefined,
    id: string,
    dto: UpdateTaskDto,
  ) {
    const user = requireUser(userMaybe);
    if (!canWrite(user.role))
      throw new ForbiddenException('Role cannot update tasks');

    const scope = requireScope(user);
    const t = await this.tasks.findOne({ where: { id, orgId: In(scope) } });
    if (!t) throw new NotFoundException('Task not found (or out of scope)');

    Object.assign(t, { ...dto, updatedAt: new Date().toISOString() });
    return this.tasks.save(t);
  }

  async remove(userMaybe: AuthUser | undefined, id: string) {
    const user = requireUser(userMaybe);
    if (!canWrite(user.role))
      throw new ForbiddenException('Role cannot delete tasks');

    const scope = requireScope(user);
    const t = await this.tasks.findOne({ where: { id, orgId: In(scope) } });
    if (!t) throw new NotFoundException('Task not found (or out of scope)');

    await this.tasks.delete({ id });
    return { ok: true };
  }
}
