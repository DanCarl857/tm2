import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Index()
  @Column({ type: 'text' })
  orgId!: string;

  @Column({ type: 'text' })
  role!: 'OWNER' | 'ADMIN' | 'VIEWER';

  @Column({ type: 'text', nullable: true })
  refreshTokenHash!: string | null;
}
