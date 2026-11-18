import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { Auth } from './auth';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReportService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends optional ISO period bounds and the applied export category', () => {
    service.get('project-1', '2026-10-01', '2026-10-31').subscribe();
    const report = http.expectOne(r => r.url.endsWith('/reports'));
    expect(report.request.params.get('from')).toBe('2026-10-01');
    expect(report.request.params.get('to')).toBe('2026-10-31');
    report.flush({});
    service.exportSnapshot('project-1', '2026-10-01', '', 'cat-1').subscribe();
    const snapshot = http.expectOne(r => r.url.endsWith('/reports/export'));
    expect(snapshot.request.params.get('from')).toBe('2026-10-01');
    expect(snapshot.request.params.has('to')).toBeFalse();
    expect(snapshot.request.params.get('category')).toBe('cat-1');
    snapshot.flush({});
  });

  it('gets the correlated authorized visual export snapshot as JSON without a category filter', () => {
    service.exportSnapshot('project/1').subscribe(snapshot => {
      expect(snapshot.report.projectId).toBe('project/1');
      expect(snapshot.filename).toBe('relatorio-casa-2026-11-02.pdf');
      expect(snapshot.generatedAt).toBe('2026-11-02');
    });
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project%2F1/reports/export`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('json');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ report: { projectId: 'project/1' }, filename: 'relatorio-casa-2026-11-02.pdf', generatedAt: '2026-11-02' });
  });

  it('gets the authorized report distribution for a project', () => {
    service.get('project-1').subscribe(report => expect(report.totalSpent).toBe(10));
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project-1/reports`);
    expect(request.request.method).toBe('GET');
    request.flush({ totalSpent: 10 });
  });

  it('preserves authentication on an export failure and does not retry', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['getToken', 'logout']);
    auth.getToken.and.returnValue('jwt-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);

    let receivedStatus: number | undefined;
    service.exportSnapshot('project-1').subscribe({ error: error => receivedStatus = error.status });
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project-1/reports/export`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({ status: 500, message: 'Não foi possível gerar o relatório.' },
      { status: 500, statusText: 'Internal Server Error' });

    expect(receivedStatus).toBe(500);
    expect(auth.logout).not.toHaveBeenCalled();
    http.expectNone(`${environment.apiUrl}/api/projects/project-1/reports/export`);
  });

  it('passes a 401 through the authentication interceptor', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['getToken', 'logout']);
    auth.getToken.and.returnValue('jwt-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);

    let receivedStatus: number | undefined;
    service.get('project-1').subscribe({
      error: error => receivedStatus = error.status,
    });
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project-1/reports`);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(receivedStatus).toBe(401);
    expect(auth.logout).toHaveBeenCalled();
  });
});
