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

  const settlement = (): PaymentService => service;

  it('settles through the dedicated PUT with only the paymentDate and returns the persisted expense', () => {
    const response = { id: 'expense', projectId: 'project', paid: true, paidAt: '2026-11-06T00:00:00Z' };
    settlement().settle('project', 'expense', '2026-11-06').subscribe(result => expect(result.paidAt).toBe(response.paidAt));
    const request = http.expectOne(`${environment.apiUrl}/api/projects/project/expenses/expense/payment`);
    expect(request.request.method).toBe('PUT'); expect(request.request.body).toEqual({ paymentDate: '2026-11-06' });
    request.flush(response);
  });

  it('reconciles using the existing expense GET and rejects a mismatched project', () => {
    let failed = false;
    settlement().reconcile('project', 'expense').subscribe({ error: () => failed = true });
    const request = http.expectOne(`${environment.apiUrl}/api/expenses/expense`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'expense', projectId: 'other', paid: true }); expect(failed).toBeTrue();
  });

  for (const operation of ['settle', 'reconcile'] as const) {
    it(`bounds ${operation} to 30 seconds without automatic retries`, fakeAsync(() => {
      let failed = false;
      const requestUrl = operation === 'settle'
        ? `${environment.apiUrl}/api/projects/project/expenses/expense/payment`
        : `${environment.apiUrl}/api/expenses/expense`;
      const result = operation === 'settle' ? settlement().settle('project', 'expense', '2026-11-06')
        : settlement().reconcile('project', 'expense');
      result.subscribe({ error: () => failed = true }); const request = http.expectOne(requestUrl);
      tick(29999); expect(failed).toBeFalse(); tick(1); expect(failed).toBeTrue();
      expect(request.cancelled).toBeTrue(); http.expectNone(requestUrl);
    }));
  }

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
