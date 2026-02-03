import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../../entities/organization.entity';
import { OrgsService } from './orgs.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity])],
  providers: [OrgsService],
  exports: [OrgsService, TypeOrmModule],
})
export class OrgsModule {}
