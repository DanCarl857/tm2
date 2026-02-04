export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  category: string | null;
  status: TaskStatus;
  order: number;
  dueDate: string | null; // ISO date (YYYY-MM-DD) or ISO datetime
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCreateIn {
  title: string;
  order?: number;
  category?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface TaskUpdateIn {
  title?: string;
  category?: string | null;
  status?: TaskStatus;
  order?: number;
  dueDate?: string | null;
}
