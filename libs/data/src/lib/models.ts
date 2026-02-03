export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';

export type Permission =
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'audit:read';

export interface Organization {
  id: string;
  name: string;
  parentOrgId: string | null; // 2-level hierarchy
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  orgId: string;
  role: Role;
  refreshTokenHash?: string | null;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskCategory = 'Work' | 'Personal';

export interface Task {
  id: string;
  orgId: string;
  createdByUserId: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  userId: string | null;
  orgId: string | null;
  method: string;
  path: string;
  action: string;
  allowed: boolean;
  reason?: string;
}
