import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Login } from './features/auth/login/login';

describe('Login routes', () => {
  for (const url of ['/', '/login']) {
    it(`opens the real login form at ${url}`, async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient()] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url, Login);
      expect(harness.routeNativeElement?.querySelector('input[formControlName="email"]')).not.toBeNull();
      expect(harness.routeNativeElement?.querySelector('input[formControlName="password"]')).not.toBeNull();
    });
  }
});
