import { Injectable, inject } from '@angular/core';
import { Auth } from './auth';

interface TokenPayload {
  sub?: unknown;
  userId?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedIdentityService {
  private readonly auth = inject(Auth);

  getUserId(): string | null {
    const token = this.auth.getToken();
    if (!token) {
      return null;
    }

    try {
      const encodedPayload = token.split('.')[1];
      if (!encodedPayload) {
        return null;
      }
      const payload = JSON.parse(this.decodeBase64Url(encodedPayload)) as TokenPayload;
      const userId = payload.sub ?? payload.userId;
      return typeof userId === 'string' && userId.trim() ? userId : null;
    } catch {
      return null;
    }
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  }
}
