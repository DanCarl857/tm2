import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './features/auth/login.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { AuthStore } from './core/auth/auth.store';

const authGuard = () => {
  const auth = inject(AuthStore);
  return auth.isAuthed() ? true : ['/login'];
};

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: TasksComponent, canActivate: [authGuard] as any },
  { path: '**', redirectTo: '' },
];
