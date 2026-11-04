import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { PaymentService } from './payment.service';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { Auth } from './auth';
import { ActiveProjectService } from './active-project.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/api/projects/project/payment-alerts`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(PaymentService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  it('gets the complete typed alert response for the selected project', () => {
    const response = { projectId: 'project', referenceDate: '2026-11-04', count: 0, totalAmount: 0, items: [] };
    service.getAlerts('project').subscribe(result => expect(result).toEqual(response));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('propagates errors without automatic retries', () => {
    let status = 0;
    service.getAlerts('project').subscribe({ error: err => status = err.status });
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
    http.expectNone(url);
  });

  it('ends a stalled request at 30 seconds without retry', fakeAsync(() => {
    let failed = false;
    service.getAlerts('project').subscribe({ error: () => failed = true });
    const req = http.expectOne(url);
    tick(29999);
    expect(failed).toBeFalse();
    tick(1);
    expect(failed).toBeTrue();
    expect(req.cancelled).toBeTrue();
    http.expectNone(url);
  }));

  it('preserves the existing 401 logout, active-project cleanup and login navigation', () => {
    const auth = TestBed.inject(Auth);
    auth.saveToken('session-token');
    const active = TestBed.inject(ActiveProjectService);
    const clear = spyOn(active, 'clear').and.callThrough();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    let status = 0;
    service.getAlerts('project').subscribe({ error: err => status = err.status });
    const req = http.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer session-token');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(auth.getToken()).toBeNull();
    expect(clear).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    http.expectNone(url);
  });
});
