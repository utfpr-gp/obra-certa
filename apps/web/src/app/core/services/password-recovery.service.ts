import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl + '/api/auth';

  request(email: string) {
    return this.http.post<void>(this.url + '/forgot-password', { email }).pipe(timeout(15000));
  }

  reset(token: string, password: string) {
    return this.http.post<void>(this.url + '/reset-password', { token, password }).pipe(timeout(15000));
  }
}
