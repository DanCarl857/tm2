import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'text' })
  name!: string;

  @Index()
  @Column({ type: 'text', nullable: true })
  parentOrgId!: string | null;
}
