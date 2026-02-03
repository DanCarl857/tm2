import { TasksStore } from './tasks.store';

describe('TasksStore (jest)', () => {
  it('filters by category', () => {
    const store = new TasksStore({ request: async () => [] } as any);

    (store as any).tasksSig.set([
      {
        id: '1',
        title: 'A',
        category: 'Work',
        status: 'TODO',
        order: 0,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        title: 'B',
        category: 'Personal',
        status: 'TODO',
        order: 1,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    store.setCategory('Work' as any);
    expect(store.filtered().length).toBe(1);
    expect(store.filtered()[0].id).toBe('1');
  });

  it('search filters tasks', () => {
    const store = new TasksStore({ request: async () => [] } as any);
    (store as any).tasksSig.set([
      {
        id: '1',
        title: 'Alpha',
        category: 'Work',
        status: 'TODO',
        order: 0,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        title: 'Bravo',
        category: 'Work',
        status: 'TODO',
        order: 1,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    store.setSearch('alp');
    expect(store.filtered().length).toBe(1);
    expect(store.filtered()[0].title).toBe('Alpha');
  });
});
