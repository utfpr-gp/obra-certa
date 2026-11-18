import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { ActiveProjectService } from './active-project.service';

import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([]), ActiveProjectService],
    });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('rejects an absent, malformed, or expired token', () => {
    expect(service.isAuthenticated()).toBeFalse();

    service.saveToken('not-a-jwt');
    expect(service.isAuthenticated()).toBeFalse();

    service.saveToken(jwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 1 }));
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('accepts a well-formed non-expired token', () => {
    service.saveToken(jwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 }));

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('clears the active project when logging out', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    service.saveToken(jwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 }));
    const activeProjectService = TestBed.inject(ActiveProjectService);
    activeProjectService.selectProject({
      id: 'project-uuid',
      name: 'Obra anterior',
      type: 'RENOVATION',
      location: null,
      status: 'IN_PROGRESS',
      createdAt: '',
      updatedAt: '',
    }, 'user-1');

    service.logout();

    expect(activeProjectService.activeProject()).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('ends an idle session at token expiration and redirects with an explanation', fakeAsync(() => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    service.saveToken(jwt({ exp: Math.floor(Date.now() / 1000) + 2 }));
    tick(2000);
    expect(service.getToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'session-expired' } });
  }));

  it('cancels the old expiration timer when a new token is saved', fakeAsync(() => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    service.saveToken(jwt({ exp: Math.floor(Date.now() / 1000) + 2 }));
    service.saveToken(jwt({ exp: Math.floor(Date.now() / 1000) + 10 }));
    tick(2000);
    expect(service.isAuthenticated()).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
    service.removeToken();
  }));

  it('redirects when another tab removes an expired token', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const expired = jwt({ exp: Math.floor(Date.now() / 1000) - 1 });
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'auth_token', oldValue: expired, newValue: null,
    }));
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'session-expired' } });
  });
});

function jwt(payload: object): string {
  const encode = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode('{"alg":"HS256","typ":"JWT"}')}.${encode(JSON.stringify(payload))}.signature`;
}
