import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the duplicate email message returned by the registration API', () => {
    component.form.setValue({
      name: 'Pessoa',
      email: 'pessoa@example.com',
      password: 'senha123',
      confirmPassword: 'senha123',
    });
    const http = TestBed.inject(HttpTestingController);
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));

    http.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/auth/register'))
      .flush({ message: 'E-mail já cadastrado' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(page.textContent).toContain('E-mail já cadastrado');
    expect(component.isLoading).toBeFalse();
    http.verify();
  });
});
