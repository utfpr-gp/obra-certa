import { TestBed } from '@angular/core/testing';
import { AuthenticatedIdentityService } from './authenticated-identity.service';
import { Auth } from './auth';

describe('AuthenticatedIdentityService', () => {
  let service: AuthenticatedIdentityService;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('Auth', ['getToken']);
    TestBed.configureTestingModule({
      providers: [
        AuthenticatedIdentityService,
        { provide: Auth, useValue: auth },
      ],
    });
    service = TestBed.inject(AuthenticatedIdentityService);
  });

  it('resolves the subject from the authenticated token', () => {
    auth.getToken.and.returnValue(
      `header.${btoa(JSON.stringify({ sub: 'user-1' }))}.signature`,
    );

    expect(service.getUserId()).toBe('user-1');
  });

  it('returns no identity for a missing, malformed, or unidentified token', () => {
    for (const token of [null, 'invalid-token', `header.${btoa('{}')}.signature`]) {
      auth.getToken.and.returnValue(token);
      expect(service.getUserId()).toBeNull();
    }
  });
});
