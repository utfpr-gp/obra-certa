import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('explains that password recovery is unavailable', () => {
    const page = fixture.nativeElement as HTMLElement;
    const help = page.querySelector<HTMLDetailsElement>('details');
    const summary = help?.querySelector('summary');

    expect(summary?.textContent).toContain('Esqueceu a senha?');
    expect(help?.open).toBeFalse();

    summary?.click();

    expect(help?.open).toBeTrue();
    expect(help?.textContent).toContain('A recuperação de senha ainda não está disponível.');
  });
});
