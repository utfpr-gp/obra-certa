import { TestBed } from '@angular/core/testing';
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
});

function jwt(payload: object): string {
  const encode = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode('{"alg":"HS256","typ":"JWT"}')}.${encode(JSON.stringify(payload))}.signature`;
}
