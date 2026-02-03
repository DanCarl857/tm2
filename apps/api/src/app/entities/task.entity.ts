import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

@Entity('task')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Tenant scope
  @Index()
  @Column({ type: 'text' })
  orgId!: string;

  // Audit/ownership
  @Index()
  @Column({ type: 'text' })
  createdByUserId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  category!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'text' })
  status!: TaskStatus;

  @Column({ type: 'int', default: 0 })
  order!: number;

  // Optional due date (store as ISO string for sqlite simplicity)
  @Column({ type: 'text', nullable: true })
  dueDate!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
