import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const token = authService.getToken();
  const publicAuthentication = /\/api\/auth\/(login|register|forgot-password|reset-password)\/?$/
    .test(req.url.split('?')[0]);

  const request = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401
          && !publicAuthentication && authService.getToken() === token) {
        authService.logout(true);
      }

      return throwError(() => error);
    }),
  );
};
