import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ActiveProjectService } from './active-project.service';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private activeProjectService = inject(ActiveProjectService);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly apiUrl = environment.apiUrl;
  private readonly zone = inject(NgZone);
  private expirationTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const check = () => this.scheduleExpiration();
    const storageCheck = (event: StorageEvent) => {
      if (event.key !== this.TOKEN_KEY && event.key !== null) return;
      if (this.getToken()) {
        check();
      } else {
        const previousExpiration = event.oldValue ? this.tokenExpiration(event.oldValue) : null;
        this.zone.run(() => this.logout(previousExpiration !== null && previousExpiration <= Date.now()));
      }
    };
    window.addEventListener('focus', check);
    window.addEventListener('storage', storageCheck);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.expirationTimer);
      window.removeEventListener('focus', check);
      window.removeEventListener('storage', storageCheck);
    });
    this.scheduleExpiration();
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{
        token: string;
      }>(`${this.apiUrl}/api/auth/login`, { email, password })
      .pipe(tap((response) => this.saveToken(response.token)));
  }

  register(name: string, email: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/auth/register`, {
      name,
      email,
      password,
    });
  }

  logout(expired = false): void {
    this.removeToken();
    this.activeProjectService.clear();
    if (expired) {
      this.router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
    } else {
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const expiration = this.tokenExpiration(token);
    return expiration !== null && expiration > Date.now();
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.scheduleExpiration();
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  removeToken(): void {
    clearTimeout(this.expirationTimer);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private scheduleExpiration(): void {
    clearTimeout(this.expirationTimer);
    const token = this.getToken();
    const expiration = token ? this.tokenExpiration(token) : null;
    if (expiration === null) return;
    this.zone.runOutsideAngular(() => {
      this.expirationTimer = setTimeout(() => {
        const current = this.getToken();
        const currentExpiration = current ? this.tokenExpiration(current) : null;
        if (currentExpiration !== null && currentExpiration <= Date.now()) {
          this.zone.run(() => this.logout(true));
        } else {
          this.scheduleExpiration();
        }
      }, Math.max(0, Math.min(expiration - Date.now(), 2147483647)));
    });
  }

  private tokenExpiration(token: string): number | null {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
      return null;
    }

    try {
      const header = JSON.parse(this.decodeBase64Url(parts[0])) as { alg?: unknown };
      const payload = JSON.parse(this.decodeBase64Url(parts[1])) as { exp?: unknown };
      const valid = typeof header.alg === 'string' &&
        header.alg.length > 0 &&
        typeof payload.exp === 'number' &&
        Number.isFinite(payload.exp) &&
        Number.isFinite(payload.exp * 1000);
      return valid ? (payload.exp as number) * 1000 : null;
    } catch {
      return null;
    }
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  }
}
