import { Component, HostListener, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TasksStore } from './tasks.store';
import { Chart, registerables } from 'chart.js';
import { Task, TaskStatus } from './task.model';
import { AuthStore } from '../../core/auth/auth.store';
import { Router } from '@angular/router';

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'app-tasks',
  imports: [CommonModule, DragDropModule],
  templateUrl: './tasks.component.html',
})
export class TasksComponent implements OnInit {
  store = inject(TasksStore);

  private router = inject(Router);
  private auth = inject(AuthStore);

  logout() {
    this.auth.clear();
    this.router.navigate(['/login']);
  }

  dark = signal<boolean>(localStorage.getItem('theme') === 'dark');

  async ngOnInit() {
    this.applyTheme();
    await this.store.load();
    queueMicrotask(() => this.renderChart());
  }

  toggleTheme() {
    this.dark.set(!this.dark());
    localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.dark());
  }

  // Use your existing Task type (import it if you already have it)
  toggleCategory(t: Task) {
    const next = t.category === 'Work' ? 'Personal' : 'Work';

    void this.store
      .update(t.id, { category: next })
      .then(() => this.renderChart());
  }

  removeTask(id: string) {
    void this.store.remove(id).then(() => this.renderChart());
  }

  onDrop(ev: CdkDragDrop<any>, status: TaskStatus) {
    const taskId = ev.item.data as string;
    const toIndex = ev.currentIndex;
    this.store
      .moveAndReorder(taskId, status, toIndex)
      .then(() => this.renderChart());
  }

  async quickAdd() {
    await this.store.create({
      title: 'New Task',
      category: 'Work',
      status: 'TODO',
    });
    this.renderChart();
  }

  renderChart() {
    const data = this.store.tasks();
    const counts = {
      TODO: data.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: data.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE: data.filter((t) => t.status === 'DONE').length,
    };

    const canvas = document.getElementById(
      'statusChart',
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const anyCanvas = canvas as any;
    if (anyCanvas.__chart) anyCanvas.__chart.destroy();

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['TODO', 'IN_PROGRESS', 'DONE'],
        datasets: [
          {
            label: 'Tasks',
            data: [counts.TODO, counts.IN_PROGRESS, counts.DONE],
          },
        ],
      },
      options: { responsive: true },
    });

    anyCanvas.__chart = chart;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'd') this.toggleTheme();
    if (e.key === 'n') this.quickAdd();
    if (e.key === '/') {
      e.preventDefault();
      (document.getElementById('search') as HTMLInputElement | null)?.focus();
    }
  }
}
