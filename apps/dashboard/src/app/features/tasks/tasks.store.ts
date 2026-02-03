import { Injectable, computed, signal, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Task, TaskCategory, TaskStatus } from './task.model';

@Injectable({ providedIn: 'root' })
export class TasksStore {
  private api = inject(ApiService);

  private tasksSig = signal<Task[]>([]);
  private filterCategorySig = signal<TaskCategory | 'All'>('All');
  private searchSig = signal<string>('');

  tasks = computed(() => this.tasksSig());

  filtered = computed(() => {
    const q = this.searchSig().trim().toLowerCase();
    const cat = this.filterCategorySig();
    return this.tasksSig().filter((t) => {
      const matchCat = cat === 'All' ? true : t.category === cat;
      const matchQ = !q
        ? true
        : t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });

  byStatus = computed(() => {
    const list = this.filtered()
      .slice()
      .sort((a, b) => a.order - b.order);
    return {
      TODO: list.filter((t) => t.status === 'TODO'),
      IN_PROGRESS: list.filter((t) => t.status === 'IN_PROGRESS'),
      DONE: list.filter((t) => t.status === 'DONE'),
    } satisfies Record<TaskStatus, Task[]>;
  });

  setSearch(v: string) {
    this.searchSig.set(v);
  }

  setCategory(v: TaskCategory | 'All') {
    this.filterCategorySig.set(v);
  }

  async load() {
    const items = await this.api.request<Task[]>('/tasks');
    this.tasksSig.set(items);
  }

  async create(input: {
    title: string;
    description?: string;
    category: TaskCategory;
    status: TaskStatus;
  }) {
    const laneCount = this.tasksSig().filter(
      (t) => t.status === input.status,
    ).length;
    const created = await this.api.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...input, order: laneCount }),
    });
    this.tasksSig.set([created, ...this.tasksSig()]);
  }

  async update(id: string, patch: Partial<Task>) {
    const updated = await this.api.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    this.tasksSig.set(this.tasksSig().map((t) => (t.id === id ? updated : t)));
  }

  async remove(id: string) {
    await this.api.request<{ ok: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
    this.tasksSig.set(this.tasksSig().filter((t) => t.id !== id));
  }

  async moveAndReorder(taskId: string, toStatus: TaskStatus, toIndex: number) {
    const all = this.tasksSig().slice();
    const task = all.find((t) => t.id === taskId);
    if (!task) return;

    task.status = toStatus;

    // recompute order within that lane (local)
    const lane = all
      .filter((t) => t.status === toStatus && t.id !== taskId)
      .sort((a, b) => a.order - b.order);

    lane.splice(toIndex, 0, task);
    lane.forEach((t, idx) => (t.order = idx));

    // persist only moved task (MVP); batch reorder would be a later enhancement
    await this.update(taskId, { status: toStatus, order: task.order });

    this.tasksSig.set(all);
  }
}
