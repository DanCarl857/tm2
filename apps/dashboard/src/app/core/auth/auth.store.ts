import { Injectable, computed, signal } from '@angular/core';

type Tokens = { accessToken: string; refreshToken: string };

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private tokensSig = signal<Tokens | null>(this.load());

  accessToken = computed(() => this.tokensSig()?.accessToken ?? null);
  tokens = computed(() => this.tokensSig());
  isAuthed = computed(() => !!this.accessToken());

  setTokens(t: Tokens) {
    this.tokensSig.set(t);
    localStorage.setItem('tokens', JSON.stringify(t));
  }

  clear() {
    this.tokensSig.set(null);
    localStorage.removeItem('tokens');
  }

  private load(): Tokens | null {
    const raw = localStorage.getItem('tokens');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Tokens;
    } catch {
      return null;
    }
  }
}
