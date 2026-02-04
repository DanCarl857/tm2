import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  effect,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';

import { TasksStore } from './tasks.store';
import { AuthStore } from '../../core/auth/auth.store';
import { Task, TaskCreateIn, TaskStatus, TaskUpdateIn } from './task.model';

type Column = { id: TaskStatus; title: string };

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './tasks.component.html',
})
export class TasksComponent {
  private tasksStore = inject(TasksStore);
  private auth = inject(AuthStore);
  private router = inject(Router);

  columns: Column[] = [
    { id: 'TODO', title: 'To do' },
    { id: 'IN_PROGRESS', title: 'In progress' },
    { id: 'DONE', title: 'Done' },
  ];

  // ---------- THEME ----------
  theme = signal<'light' | 'dark'>(this.loadTheme());
  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('theme', next);
    this.applyTheme(next);
  }

  private loadTheme(): 'light' | 'dark' {
    const t = (localStorage.getItem('theme') as any) || 'light';
    return t === 'dark' ? 'dark' : 'light';
  }
  private applyTheme(t: 'light' | 'dark') {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  // ---------- UI STATE ----------
  modalOpen = signal(false);
  editingId = signal<string | null>(null);

  title = signal('');
  category = signal<'Work' | 'Personal'>('Work');
  dueDate = signal<string>(''); // YYYY-MM-DD
  status = signal<TaskStatus>('TODO');

  filterText = signal('');
  filterCategory = signal<'All' | 'Work' | 'Personal'>('All');

  // ---------- DRAG/DROP LISTS (STABLE ARRAYS) ----------
  todoList = signal<Task[]>([]);
  inProgressList = signal<Task[]>([]);
  doneList = signal<Task[]>([]);

  // ---------- CHART METRICS ----------
  totalCount = computed(
    () =>
      this.todoList().length +
      this.inProgressList().length +
      this.doneList().length,
  );

  todoPct = computed(() =>
    this.totalCount() ? (this.todoList().length * 100) / this.totalCount() : 0,
  );
  inProgressPct = computed(() =>
    this.totalCount()
      ? (this.inProgressList().length * 100) / this.totalCount()
      : 0,
  );
  donePct = computed(() =>
    this.totalCount() ? (this.doneList().length * 100) / this.totalCount() : 0,
  );

  constructor() {
    // apply theme immediately
    this.applyTheme(this.theme());

    // load tasks and keep stable per-column arrays in sync
    effect(() => {
      this.tasksStore.load();
    });

    effect(() => {
      const all = this.tasksStore.tasks();
      const text = this.filterText().trim().toLowerCase();
      const cat = this.filterCategory();

      const matches = (t: Task) => {
        if (
          cat !== 'All' &&
          (t.category ?? '').toLowerCase() !== cat.toLowerCase()
        )
          return false;
        if (!text) return true;
        return (
          t.title.toLowerCase().includes(text) ||
          (t.category ?? '').toLowerCase().includes(text)
        );
      };

      const byStatus = (s: TaskStatus) =>
        all
          .filter((t) => t.status === s)
          .filter(matches)
          .slice()
          .sort((a, b) => a.order - b.order);

      // IMPORTANT: set stable arrays (signals), not computed arrays
      this.todoList.set(byStatus('TODO'));
      this.inProgressList.set(byStatus('IN_PROGRESS'));
      this.doneList.set(byStatus('DONE'));
    });
  }

  // ---------- SHORTCUTS ----------
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    // Ctrl/Cmd + N = new task
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      this.openCreate('TODO');
    }
    // Esc closes modal
    if (e.key === 'Escape' && this.modalOpen()) {
      this.closeModal();
    }
    // "/" focuses filter input (if present)
    if (e.key === '/' && !this.modalOpen()) {
      const el = document.getElementById(
        'taskFilterInput',
      ) as HTMLInputElement | null;
      if (el) {
        e.preventDefault();
        el.focus();
      }
    }
  }

  // ---------- TEMPLATE HELPERS ----------
  connectedDropListIds(): string[] {
    return this.columns.map((c) => this.dropListId(c.id));
  }
  dropListId(status: TaskStatus): string {
    return `drop-${status}`;
  }
  trackById(_i: number, t: Task) {
    return t.id;
  }

  // ---------- MODAL ----------
  openCreate(status: TaskStatus = 'TODO') {
    this.editingId.set(null);
    this.title.set('');
    this.category.set('Work');
    this.dueDate.set('');
    this.status.set(status);
    this.modalOpen.set(true);
  }

  openEdit(t: Task) {
    this.editingId.set(t.id);
    this.title.set(t.title);
    this.category.set((t.category ?? 'Work') as any);
    this.dueDate.set(t.dueDate ? t.dueDate.slice(0, 10) : '');
    this.status.set(t.status);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  async saveModal() {
    const title = this.title().trim();
    if (!title) return;

    const base = {
      title,
      category: this.category(),
      dueDate: this.dueDate().trim() ? this.dueDate().trim() : null,
      status: this.status(),
    };

    const id = this.editingId();
    if (!id) {
      const create: TaskCreateIn = {
        ...base,
        order: 0,
        // order: 0, // backend/service can normalize later; store will also fix order after refresh
      };
      await this.tasksStore.create(create);
    } else {
      const update: TaskUpdateIn = base;
      await this.tasksStore.update(id, update);
    }

    this.closeModal();
  }

  async deleteTask(t: Task) {
    await this.tasksStore.remove(t.id);
  }

  // ---------- DRAG/DROP ----------
  async dropped(targetStatus: TaskStatus, ev: CdkDragDrop<Task[]>) {
    const src = ev.previousContainer.data;
    const dst = ev.container.data;

    // reorder within same column
    if (ev.previousContainer === ev.container) {
      moveItemInArray(dst, ev.previousIndex, ev.currentIndex);
      await this.persistOrdersForColumn(targetStatus, dst);
      return;
    }

    // move across columns
    transferArrayItem(src, dst, ev.previousIndex, ev.currentIndex);

    const moved = dst[ev.currentIndex];
    await this.tasksStore.update(moved.id, { status: targetStatus });

    const srcStatus = this.statusFromDropId(ev.previousContainer.id);
    if (srcStatus) await this.persistOrdersForColumn(srcStatus, src);
    await this.persistOrdersForColumn(targetStatus, dst);
  }

  private statusFromDropId(id: string): TaskStatus | null {
    if (id.endsWith('TODO')) return 'TODO';
    if (id.endsWith('IN_PROGRESS')) return 'IN_PROGRESS';
    if (id.endsWith('DONE')) return 'DONE';
    return null;
  }

  private async persistOrdersForColumn(status: TaskStatus, list: Task[]) {
    // normalize + persist
    const ops: Promise<void>[] = [];
    list.forEach((t, idx) => {
      if (t.order !== idx || t.status !== status) {
        t.order = idx;
        t.status = status;
        ops.push(this.tasksStore.update(t.id, { order: idx, status }));
      }
    });
    await Promise.all(ops);
  }

  logout() {
    this.auth.clear();
    this.router.navigateByUrl('/login');
  }
}
