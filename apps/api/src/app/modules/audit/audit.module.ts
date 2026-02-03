import { Module } from '@nestjs/common';
import { AuditStore } from './audit.store';

@Module({
  providers: [AuditStore],
  exports: [AuditStore],
})
export class AuditModule {}
