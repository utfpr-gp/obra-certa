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

  it('downloads the complete PDF as a Blob with response headers', () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    service.exportPdf('project/1').subscribe(response => {
      expect(response.body).toEqual(blob);
      expect(response.headers.get('Content-Disposition')).toContain('relatorio-casa');
    });
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project%2F1/reports/pdf`);
    expect(request.request.responseType).toBe('blob');
    request.flush(blob, { headers: { 'Content-Disposition': 'attachment; filename="relatorio-casa-2026-11-02.pdf"' } });
  });

  it('gets the authorized report distribution for a project', () => {
    service.get('project-1').subscribe(report => expect(report.totalSpent).toBe(10));
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project-1/reports`);
    expect(request.request.method).toBe('GET');
    request.flush({ totalSpent: 10 });
  });

  it('preserves authentication on a PDF generation 500 and does not retry', () => {
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
    service.exportPdf('project-1').subscribe({ error: error => receivedStatus = error.status });
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project-1/reports/pdf`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush(new Blob(['{"status":500,"message":"Não foi possível gerar o PDF."}'],
      { type: 'application/json' }), { status: 500, statusText: 'Internal Server Error' });

    expect(receivedStatus).toBe(500);
    expect(auth.logout).not.toHaveBeenCalled();
    http.expectNone(`${environment.apiUrl}/api/projects/project-1/reports/pdf`);
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
