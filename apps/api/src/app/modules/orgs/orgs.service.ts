import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../../entities/organization.entity';

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private orgs: Repository<OrganizationEntity>,
  ) {}

  async ensureTwoLevelHierarchy(orgId: string) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new BadRequestException('Org not found');
    if (org.parentOrgId) {
      const parent = await this.orgs.findOne({
        where: { id: org.parentOrgId },
      });
      if (!parent) throw new BadRequestException('Parent org not found');
      if (parent.parentOrgId)
        throw new BadRequestException('Only 2-level org hierarchy supported');
    }
    return org;
  }
}
