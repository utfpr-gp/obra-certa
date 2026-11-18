import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { ExpenseResponse } from '../models/expense-registration.model';
import { NfePreview } from '../models/nfe-import.model';
import { ActiveProjectService } from './active-project.service';
import { Auth } from './auth';
import { NfeImportService } from './nfe-import.service';

describe('NfeImportService', () => {
  let service: NfeImportService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/api/projects/project-a/nfe/preview`;
  const importsUrl = `${environment.apiUrl}/api/projects/project-a/nfe/imports`;
  const file = new File(['<nfe/>'], 'nota.xml', { type: 'application/xml' });
  const created: ExpenseResponse[] = [
    {
      id: 'expense-1', projectId: 'project-a', description: 'Cimento CP II', purchaseDate: '2026-07-10',
      categoryId: 'cat-1', categoryName: 'Alvenaria', supplier: { id: 'sup-1', name: 'Fornecedor XPTO', document: '12345678000199' },
      paid: true, dueDate: null, quantity: 2, unitPrice: 25, totalPrice: 50, receiptState: 'UPLOADED',
    },
    {
      id: 'expense-2', projectId: 'project-a', description: 'Areia média', purchaseDate: '2026-07-10',
      categoryId: 'cat-2', categoryName: 'Elétrica', supplier: { id: 'sup-1', name: 'Fornecedor XPTO', document: '12345678000199' },
      paid: true, dueDate: null, quantity: 1.5, unitPrice: 80, totalPrice: 120, receiptState: 'NONE',
    },
  ];

  const preview: NfePreview = {
    projectId: 'project-a',
    accessKey: '35260112345678000199550010000012341000012345',
    issueDate: '2026-07-10',
    supplier: { name: 'Fornecedor XPTO', document: '12345678000199' },
    items: [
      { itemNumber: 1, description: 'Cimento CP II', quantity: 2, unit: 'saco', unitPrice: 25, totalPrice: 50 },
    ],
    total: 50,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(NfeImportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('posts the selected XML as multipart to the project preview endpoint and returns the typed response', () => {
    let received: NfePreview | undefined;
    service.preview('project-a', file).subscribe((response) => (received = response));

    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    expect((body.get('file') as File).name).toBe('nota.xml');
    expect(body.getAll('file').length).toBe(1);
    request.flush(preview);

    expect(received).toEqual(preview);
  });

  it('propagates the backend 400 payload without converting it into a preview', () => {
    let received: HttpErrorResponse | undefined;
    service.preview('project-a', file).subscribe({ error: (error) => (received = error) });

    http.expectOne(url).flush(
      { status: 400, message: 'O arquivo XML está corrompido ou incompleto', fieldErrors: [] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(received instanceof HttpErrorResponse).toBeTrue();
    expect(received?.status).toBe(400);
    expect((received?.error as { message: string }).message).toBe('O arquivo XML está corrompido ou incompleto');
    http.expectNone(url);
  });

  it('propagates the 409 already-registered conflict without retrying', () => {
    let received: HttpErrorResponse | undefined;
    service.preview('project-a', file).subscribe({ error: (error) => (received = error) });

    http.expectOne(url).flush(
      { status: 409, message: 'A nota fiscal já foi registrada', fieldErrors: [] },
      { status: 409, statusText: 'Conflict' },
    );

    expect(received?.status).toBe(409);
    expect((received?.error as { message: string }).message).toBe('A nota fiscal já foi registrada');
    http.expectNone(url);
  });

  it('ends a stalled upload at 30 seconds without an automatic retry', fakeAsync(() => {
    let failed = false;
    service.preview('project-a', file).subscribe({ error: () => (failed = true) });
    const request = http.expectOne(url);

    tick(29999);
    expect(failed).toBeFalse();
    tick(1);
    expect(failed).toBeTrue();
    expect(request.cancelled).toBeTrue();
    http.expectNone(url);
  }));

  it('preserves the existing 401 logout, active-project cleanup and login navigation', () => {
    const auth = TestBed.inject(Auth);
    auth.saveToken('session-token');
    const active = TestBed.inject(ActiveProjectService);
    const clear = spyOn(active, 'clear').and.callThrough();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    let status = 0;

    service.preview('project-a', file).subscribe({ error: (error) => (status = error.status) });
    const request = http.expectOne(url);
    expect(request.request.headers.get('Authorization')).toBe('Bearer session-token');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.getToken()).toBeNull();
    expect(clear).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'session-expired' } });
    http.expectNone(url);
  });

  it('posts the confirmation as multipart with the file, the category choices and the payment part', async () => {
    let received: ExpenseResponse[] | undefined;
    service.confirm('project-a', file, [
      { itemNumber: 1, categoryId: 'cat-1' },
      { itemNumber: 2, categoryId: 'cat-2' },
    ], true).subscribe((response) => (received = response));

    const request = http.expectOne(importsUrl);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    expect((body.get('file') as File).name).toBe('nota.xml');
    expect(body.getAll('file').length).toBe(1);

    const items = body.get('items') as Blob;
    expect(items instanceof Blob).toBeTrue();
    expect(items.type).toBe('application/json');
    expect(JSON.parse(await items.text())).toEqual({
      items: [
        { itemNumber: 1, categoryId: 'cat-1' },
        { itemNumber: 2, categoryId: 'cat-2' },
      ],
    });

    const payment = body.get('payment') as Blob;
    expect(payment instanceof Blob).toBeTrue();
    expect(payment.type).toBe('application/json');
    expect(JSON.parse(await payment.text())).toEqual({ paid: true });

    request.flush(created);
    expect(received).toEqual(created);
  });

  it('sends paid=false in the payment part when the note is pending', async () => {
    service.confirm('project-a', file, [{ itemNumber: 1, categoryId: 'cat-1' }], false).subscribe();

    const request = http.expectOne(importsUrl);
    const payment = (request.request.body as FormData).get('payment') as Blob;
    expect(payment.type).toBe('application/json');
    expect(JSON.parse(await payment.text())).toEqual({ paid: false });
    request.flush(created);
  });

  it('ends a stalled confirmation at 30 seconds without an automatic retry', fakeAsync(() => {
    let failed = false;
    service.confirm('project-a', file, [{ itemNumber: 1, categoryId: 'cat-1' }], true)
      .subscribe({ error: () => (failed = true) });
    const request = http.expectOne(importsUrl);

    tick(29999);
    expect(failed).toBeFalse();
    tick(1);
    expect(failed).toBeTrue();
    expect(request.cancelled).toBeTrue();
    http.expectNone(importsUrl);
  }));
});
