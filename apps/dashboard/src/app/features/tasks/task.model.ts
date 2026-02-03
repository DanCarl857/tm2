export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskCategory = 'Work' | 'Personal';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}
