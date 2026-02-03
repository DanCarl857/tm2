import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private auth = inject(AuthStore);

  // If you store API base in env later, keep this one place.
  private baseUrl = 'http://localhost:3000';

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = this.auth.accessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    // handle empty responses
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(message);
    }

    return data as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
