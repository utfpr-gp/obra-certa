import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PasswordRecovery } from './password-recovery';
import { PasswordReset } from './password-reset';
import { routes } from '../../../app.routes';

describe('Password recovery', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('opens the public request route and uses a generic success message', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/recuperar-senha', PasswordRecovery);
    component.form.setValue({ email: 'pessoa@example.com' });
    component.submit();
    component.submit();
    const request = http.expectOne((r) => r.url.endsWith('/auth/forgot-password'));
    expect(request.request.body).toEqual({ email: 'pessoa@example.com' });
    request.flush(null);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent)
      .toContain('Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
  });

  it('validates matching passwords and sends the token from the email link', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/redefinir-senha#token=abc123', PasswordReset);
    component.form.setValue({ password: 'novaSenha', confirmPassword: 'diferente' });
    component.submit();
    http.expectNone((r) => r.url.endsWith('/auth/reset-password'));
    component.form.patchValue({ confirmPassword: 'novaSenha' });
    component.submit();
    const request = http.expectOne((r) => r.url.endsWith('/auth/reset-password'));
    expect(request.request.body).toEqual({ token: 'abc123', password: 'novaSenha' });
    request.flush(null);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Senha redefinida com sucesso.');
    expect(component.form.controls.password.value).toBe('');
  });

  it('offers a new link when the token is invalid or already used', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/redefinir-senha#token=used', PasswordReset);
    component.form.setValue({ password: 'novaSenha', confirmPassword: 'novaSenha' });
    component.submit();
    http.expectOne((r) => r.url.endsWith('/auth/reset-password'))
      .flush({ message: 'Este link é inválido ou expirou. Solicite um novo link.' }, { status: 400, statusText: 'Bad Request' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent)
      .toContain('Este link é inválido ou expirou. Solicite um novo link.');
    expect(harness.routeNativeElement?.querySelector('a[href="/recuperar-senha"]')).not.toBeNull();
  });

  it('rejects a password that exceeds the encoder byte limit before sending', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/redefinir-senha#token=valid', PasswordReset);
    const password = 'é'.repeat(40);
    component.form.setValue({ password, confirmPassword: password });
    component.submit();
    expect(component.form.controls.password.hasError('passwordTooLong')).toBeTrue();
    http.expectNone((r) => r.url.endsWith('/auth/reset-password'));
  });

  it('ends a stalled request and preserves the email for a manual retry', fakeAsync(() => {
    const fixture = TestBed.createComponent(PasswordRecovery);
    fixture.componentInstance.form.setValue({ email: 'pessoa@example.com' });
    fixture.componentInstance.submit();
    const request = http.expectOne((r) => r.url.endsWith('/auth/forgot-password'));
    tick(15000);
    expect(request.cancelled).toBeTrue();
    expect(fixture.componentInstance.busy()).toBeFalse();
    expect(fixture.componentInstance.form.controls.email.value).toBe('pessoa@example.com');
    expect(fixture.componentInstance.error()).toContain('Não foi possível');
  }));
});
