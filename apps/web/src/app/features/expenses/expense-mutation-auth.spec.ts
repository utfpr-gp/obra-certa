import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { Auth } from '../../core/services/auth';
import { ExpenseService } from '../../core/services/expense.service';
import { environment } from '../../../environments/environment';

describe('expense mutation authentication', () => {
  const endpoint = `${environment.apiUrl}/api/expenses/expense`;
  const replacement = new File(['%PDF-1.4'], 'replacement.pdf', { type: 'application/pdf' });
  type Mutation = {
    name: string;
    path: string;
    request: () => Observable<unknown>;
  };
  let http: HttpTestingController;
  let expenses: ExpenseService;
  let auth: Auth;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        ActiveProjectService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    expenses = TestBed.inject(ExpenseService);
    auth = TestBed.inject(Auth);
    router = TestBed.inject(Router);
    TestBed.inject(ActiveProjectService).selectProject({
      id: 'project',
      name: 'Casa',
      type: 'RENOVATION',
      status: 'IN_PROGRESS',
      location: null,
      createdAt: '',
      updatedAt: '',
    }, 'owner');
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    TestBed.inject(ActiveProjectService).clear();
  });

  for (const mutation of [
    { name: 'edição', path: '', request: (): Observable<unknown> => expenses.update('expense', {
      description: 'Corrigida',
      purchaseDate: '2030-01-01',
      categoryId: 'category',
      valueMode: 'DIRECT' as const,
      paid: true,
      totalPrice: 100,
    }) },
    { name: 'exclusão', path: '', request: (): Observable<unknown> => expenses.delete('expense') },
    { name: 'remoção do comprovante', path: '/receipt', request: (): Observable<unknown> => expenses.removeReceipt('expense') },
    { name: 'substituição do comprovante', path: '/receipt', request: (): Observable<unknown> => expenses.uploadReceipt('expense', replacement) },
  ] satisfies Mutation[]) {
    it(`encerra a sessão em 401 durante ${mutation.name}, sem repetir a operação`, () => {
      const token = jwt(Math.floor(Date.now() / 1000) + 3600);
      auth.saveToken(token);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      const logout = spyOn(auth, 'logout').and.callThrough();
      let received: unknown;

      mutation.request().subscribe({ error: error => received = error });
      const request = http.expectOne(endpoint + mutation.path);
      expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      request.flush({ message: 'Sessão expirada' }, { status: 401, statusText: 'Unauthorized' });

      expect(received).toEqual(jasmine.any(HttpErrorResponse));
      expect(logout).toHaveBeenCalledOnceWith();
      expect(auth.getToken()).toBeNull();
      expect(TestBed.inject(ActiveProjectService).activeProject()).toBeNull();
      expect(navigate).toHaveBeenCalledOnceWith(['/login']);

      auth.saveToken(jwt(Math.floor(Date.now() / 1000) + 3600));
      http.expectNone(endpoint + mutation.path);
    });
  }

  it('propaga a falha de autenticação sem preservar intenção para reenvio', async () => {
    auth.saveToken(jwt(Math.floor(Date.now() / 1000) - 1));
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    const failed = firstValueFrom(expenses.delete('expense')).then(
      () => false,
      error => error instanceof HttpErrorResponse,
    );
    const request = http.expectOne(endpoint);
    request.flush({ message: 'Não autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(await failed).toBeTrue();
    expect(auth.getToken()).toBeNull();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    auth.saveToken(jwt(Math.floor(Date.now() / 1000) + 3600));
    http.expectNone(endpoint);
  });

  it('mantém as quatro mutações autorizadas quando o token é válido', () => {
    auth.saveToken(jwt(Math.floor(Date.now() / 1000) + 3600));
    const calls: Observable<unknown>[] = [
      expenses.update('expense', {
        description: 'Corrigida', purchaseDate: '2030-01-01', categoryId: 'category',
        valueMode: 'DIRECT' as const, paid: true, totalPrice: 100,
      }),
      expenses.delete('expense'),
      expenses.removeReceipt('expense'),
      expenses.uploadReceipt('expense', replacement),
    ];

    for (const call of calls) {
      call.subscribe();
      const request = http.expectOne(req => req.url.startsWith(endpoint));
      expect(request.request.headers.get('Authorization')).toContain('Bearer ');
      request.flush({ id: 'expense', deleted: true, receiptDeletionFailed: false });
    }
    expect(auth.getToken()).not.toBeNull();
  });
});

function jwt(exp: number): string {
  const encode = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode('{"alg":"HS256","typ":"JWT"}')}.${encode(JSON.stringify({ sub: 'owner', exp }))}.signature`;
}
