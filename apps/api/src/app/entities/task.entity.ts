import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'text' })
  orgId!: string;

  @Index()
  @Column({ type: 'text' })
  createdByUserId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text' })
  category!: 'Work' | 'Personal';

  @Index()
  @Column({ type: 'text' })
  status!: 'TODO' | 'IN_PROGRESS' | 'DONE';

  @Column({ type: 'integer' })
  order!: number;

  @Column({ type: 'text' })
  createdAt!: string;

  @Column({ type: 'text' })
  updatedAt!: string;
}
