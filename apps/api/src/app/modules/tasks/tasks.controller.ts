import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '@ckouetchua-87342/auth';
import { CreateTaskDto, UpdateTaskDto } from '@ckouetchua-87342/data';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@Controller('/tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @RequirePermission('task:create')
  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.authUser, dto);
  }

  @RequirePermission('task:read')
  @Get()
  list(@Req() req: any) {
    return this.tasks.listAccessible(req.authUser);
  }

  @RequirePermission('task:update')
  @Put('/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(req.authUser, id, dto);
  }

  @RequirePermission('task:delete')
  @Delete('/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasks.remove(req.authUser, id);
  }
}
