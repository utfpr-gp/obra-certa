import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { NfePreview } from '../models/nfe-import.model';
import { ActiveProjectService } from './active-project.service';
import { Auth } from './auth';
import { NfeImportService } from './nfe-import.service';

describe('NfeImportService', () => {
  let service: NfeImportService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/api/projects/project-a/nfe/preview`;
  const file = new File(['<nfe/>'], 'nota.xml', { type: 'application/xml' });

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
    expect(navigate).toHaveBeenCalledWith(['/login']);
    http.expectNone(url);
  });
});
