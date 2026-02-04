/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TasksComponent } from './tasks.component';
import { TasksStore } from './tasks.store';
import { AuthStore } from '../../core/auth/auth.store';

describe('TasksComponent (jest)', () => {
  it('toggles theme', () => {
    const storeMock = {
      load: jest.fn(async () => {}),
      tasks: jest.fn(() => []),
      create: jest.fn(async () => {}),
      update: jest.fn(async () => {}),
      remove: jest.fn(async () => {}),
    };

    const authMock = {
      clear: jest.fn(),
    };

    const routerMock = {
      navigateByUrl: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TasksStore, useValue: storeMock },
        { provide: AuthStore, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    // make sure theme starts from a known state
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');

    const c = TestBed.runInInjectionContext(() => new TasksComponent());

    const before = c.theme();
    c.toggleTheme();

    expect(c.theme()).toBe(before === 'dark' ? 'light' : 'dark');
    expect(localStorage.getItem('theme')).toBe(c.theme());
  });
});
