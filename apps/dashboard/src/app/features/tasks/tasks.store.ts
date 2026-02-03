import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Task, TaskCreateIn, TaskUpdateIn } from './task.model';

@Injectable({ providedIn: 'root' })
export class TasksStore {
  private api: ApiService;
  tasks = signal<Task[]>([]);

  constructor() {
    const api = inject(ApiService);

    this.api = api;
  }

  async load() {
    const rows = await this.api.get<Task[]>('/tasks');
    this.tasks.set(rows);
  }

  async create(payload: TaskCreateIn) {
    const created = await this.api.post<Task>('/tasks', payload);
    this.tasks.set([...this.tasks(), created]);
  }

  async update(id: string, payload: TaskUpdateIn) {
    const updated = await this.api.put<Task>(`/tasks/${id}`, payload);
    this.tasks.set(this.tasks().map((t) => (t.id === id ? updated : t)));
  }

  async remove(id: string) {
    await this.api.delete(`/tasks/${id}`);
    this.tasks.set(this.tasks().filter((t) => t.id !== id));
  }
}
