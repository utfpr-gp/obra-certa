import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import {isPlatformBrowser} from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

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
    this.router.navigate(['/']);
    }

    isAuthenticated() {
      return  !!this.getToken();
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

  removeToken(){
    if(isPlatformBrowser(this.platformId)){
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }
}
