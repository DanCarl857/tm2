import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, Reflector } from '@nestjs/core';

import { PermissionGuard } from '@ckouetchua-87342/auth';
import { TenantContextMiddleware } from './common/tenant-context.middleware';

import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { OrgsModule } from './modules/orgs/orgs.module';

import { UserEntity } from './entities/user.entity';
import { OrganizationEntity } from './entities/organization.entity';
import { TaskEntity } from './entities/task.entity';

import { DataSource } from 'typeorm';
import { devSeed } from './dev-seed';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.SQLITE_PATH ?? 'dev.sqlite',
      entities: [UserEntity, OrganizationEntity, TaskEntity],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    OrgsModule,
    TasksModule,
    AuditModule,
  ],
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: PermissionGuard },
    {
      provide: 'DEV_SEED',
      inject: [DataSource],
      useFactory: async (ds: DataSource) => devSeed(ds),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
