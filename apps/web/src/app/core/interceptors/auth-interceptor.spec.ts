import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { authInterceptor } from './auth-interceptor';
import { Auth } from '../services/auth';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['getToken', 'logout']);
    auth.getToken.and.returnValue('jwt-token');
    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: auth }],
    });
  });

  it('logs out and preserves the error when the session is unauthorized', () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const request = new HttpRequest('GET', '/api/projects');

    interceptor(request, () => throwError(() => error)).subscribe({
      error: (receivedError: HttpErrorResponse) => {
        expect(receivedError).toBe(error);
      },
    });

    expect(auth.logout).toHaveBeenCalledWith(true);
  });

  it('preserves generic server errors for the requesting service', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const request = new HttpRequest('GET', '/api/projects');

    interceptor(request, () => throwError(() => error)).subscribe({
      error: (receivedError: HttpErrorResponse) => {
        expect(receivedError).toBe(error);
      },
    });

    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('does not handle domain errors as authentication failures', () => {
    const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    const request = new HttpRequest('GET', '/api/projects/project-1');

    interceptor(request, () => throwError(() => error)).subscribe({
      error: (receivedError: HttpErrorResponse) => {
        expect(receivedError).toBe(error);
      },
    });

    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('keeps invalid login credentials on the login form without an expiry notice', () => {
    const request = new HttpRequest('POST', '/obracerta/api/auth/login', {});
    interceptor(request, () => throwError(() => new HttpErrorResponse({ status: 401 })))
      .subscribe({ error: () => {} });
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('does not end a new session when an old request returns unauthorized', () => {
    auth.getToken.and.returnValues('old-token', 'new-token');
    interceptor(new HttpRequest('GET', '/api/projects'),
      () => throwError(() => new HttpErrorResponse({ status: 401 })))
      .subscribe({ error: () => {} });
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
