import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth-guard';
import { Auth } from './core/services/auth';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { ReportsPageComponent } from './features/reports/reports-page.component';

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

describe('Reports route', () => {
  it('places reports inside the authenticated main layout', () => {
    const shell = routes.find(route => route.component === MainLayoutComponent)!;
    expect(shell.canActivate).toContain(authGuard);
    expect(shell.children?.find(route => route.path === 'relatorios')?.component).toBe(ReportsPageComponent);
  });

  it('redirects unauthenticated access to the login form', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), { provide: Auth, useValue: { isAuthenticated: () => false } }] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/relatorios');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('input[formControlName="email"]')).not.toBeNull();
  });
});
