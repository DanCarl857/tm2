import { TasksComponent } from './tasks.component';

describe('TasksComponent (jest)', () => {
  it('toggles theme', () => {
    const c = new TasksComponent({
      load: async () => {},
      tasks: () => [],
      byStatus: () => ({ TODO: [], IN_PROGRESS: [], DONE: [] }),
      moveAndReorder: async () => {},
      create: async () => {},
    } as any);

    const before = c.dark();
    c.toggleTheme();
    expect(c.dark()).toBe(!before);
  });
});
