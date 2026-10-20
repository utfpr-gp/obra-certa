import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter } from '@angular/router';
import { Auth } from '../services/auth';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: { isAuthenticated: () => false } },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('rejects an invalid token using Auth policy', () => {
    expect(executeGuard({} as never, {} as never)).toBeFalse();
  });

  it('allows an authenticated token', () => {
    TestBed.overrideProvider(Auth, { useValue: { isAuthenticated: () => true } });

    expect(executeGuard({} as never, {} as never)).toBeTrue();
  });
});
