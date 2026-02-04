import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div class="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h1 class="text-xl font-semibold">Login</h1>
        <p class="text-sm opacity-70 mb-3">admin@gamma-parent.com / password123 (consult the README for more accounts)</p>

        <label class="block text-sm mb-1">Email</label>
        <input class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
          [value]="email()" (input)="email.set(($any($event.target)).value)" />

        <label class="block text-sm mt-3 mb-1">Password</label>
        <input type="password"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
          [value]="password()" (input)="password.set(($any($event.target)).value)" />

        <button class="mt-4 w-full px-3 py-2 rounded-lg bg-indigo-600 text-white" (click)="submit()">
          Sign in
        </button>

       @if (err()) {
          <div class="text-sm text-red-500 mt-2">
            {{ err() }}
          </div>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthStore);
  private router = inject(Router);

  email = signal('admin@gamma-parent.com');
  password = signal('password123');
  err = signal<string | null>(null);

  async submit() {
    this.err.set(null);
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email(),
          password: this.password(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      this.auth.setTokens(data);
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.err.set(e?.message ?? 'Login failed');
    }
  }
}
