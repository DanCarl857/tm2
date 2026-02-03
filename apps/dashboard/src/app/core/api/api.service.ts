import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

const API_BASE = (globalThis as any).__API_BASE__ ?? 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private auth = inject(AuthStore);

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    headers.set('Content-Type', 'application/json');

    const token = this.auth.accessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

    // Attempt refresh once on 401
    if (res.status === 401 && this.auth.tokens()?.refreshToken) {
      const ok = await this.refresh();
      if (ok) {
        const headers2 = new Headers(init.headers ?? {});
        headers2.set('Content-Type', 'application/json');
        headers2.set('Authorization', `Bearer ${this.auth.accessToken()}`);

        const res2 = await fetch(`${API_BASE}${path}`, {
          ...init,
          headers: headers2,
        });
        if (!res2.ok) throw new Error(await res2.text());
        return (await res2.json()) as T;
      }
    }

    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  }

  async refresh(): Promise<boolean> {
    const refreshToken = this.auth.tokens()?.refreshToken;
    if (!refreshToken) return false;

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { accessToken: string };
    this.auth.setTokens({ accessToken: data.accessToken, refreshToken });
    return true;
  }
}
