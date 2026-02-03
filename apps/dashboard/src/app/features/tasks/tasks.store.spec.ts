import { TestBed } from '@angular/core/testing';
import { TasksStore } from './tasks.store';
import { ApiService } from '../../core/api/api.service';

describe('TasksStore (jest)', () => {
  function createStore() {
    const apiMock = {
      get: jest.fn(async () => []),
      post: jest.fn(async () => ({})),
      put: jest.fn(async () => ({})),
      delete: jest.fn(async () => ({})),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiMock }],
    });

    return TestBed.runInInjectionContext(() => new TasksStore());
  }

  it('filters by category (test-side)', () => {
    const store = createStore();

    store.tasks.set([
      {
        id: '1',
        title: 'A',
        category: 'Work',
        status: 'TODO',
        order: 0,
      } as any,
      {
        id: '2',
        title: 'B',
        category: 'Personal',
        status: 'TODO',
        order: 1,
      } as any,
    ]);

    const filtered = store.tasks().filter((t) => t.category === 'Work');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });

  it('search filters tasks (test-side)', () => {
    const store = createStore();

    store.tasks.set([
      {
        id: '1',
        title: 'Alpha',
        category: 'Work',
        status: 'TODO',
        order: 0,
      } as any,
      {
        id: '2',
        title: 'Bravo',
        category: 'Work',
        status: 'TODO',
        order: 1,
      } as any,
    ]);

    const q = 'alp';
    const filtered = store
      .tasks()
      .filter((t) => t.title.toLowerCase().includes(q));
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Alpha');
  });
});
