import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
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

  logout(): void {
    this.removeToken();
    this.activeProjectService.clear();
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    return this.isValidToken(token);
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private isValidToken(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
      return false;
    }

    try {
      const header = JSON.parse(this.decodeBase64Url(parts[0])) as { alg?: unknown };
      const payload = JSON.parse(this.decodeBase64Url(parts[1])) as { exp?: unknown };
      return typeof header.alg === 'string' &&
        header.alg.length > 0 &&
        typeof payload.exp === 'number' &&
        Number.isFinite(payload.exp) &&
        payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  }
}
