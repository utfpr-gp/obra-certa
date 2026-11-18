import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { HomePage } from '../../../features/home-page/home-page';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../../core/services/authenticated-identity.service';
import { ProjectService } from '../../../core/services/project.service';
import { BudgetService } from '../../../core/services/budget.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { Auth } from '../../../core/services/auth';
import { authInterceptor } from '../../../core/interceptors/auth-interceptor';
import { Project, ProjectStatus, ProjectType } from '../../../core/models/project.model';
import { ExpenseResponse } from '../../../core/models/expense-registration.model';
import { PaymentAlerts } from '../../../core/models/payment.model';
import { environment } from '../../../../environments/environment';

describe('Payment modal through the Home HTTP flow', () => {
  let fixture: ComponentFixture<HomePage>;
  let http: HttpTestingController;
  let active: ActiveProjectService;
  const api = `${environment.apiUrl}/api`;
  const project: Project = { id: 'A', name: 'Minha obra', type: ProjectType.RENOVATION,
    status: ProjectStatus.IN_PROGRESS, location: '', createdAt: '', updatedAt: '' };
  const alertsUrl = `${api}/projects/A/payment-alerts`;
  const paymentUrl = `${api}/projects/A/expenses/expense/payment`;
  const expenseUrl = `${api}/expenses/expense`;
  const expense: ExpenseResponse = { id: 'expense', projectId: 'A', description: 'Cimento',
    purchaseDate: '2026-10-01', totalPrice: 120, categoryId: 'category', categoryName: 'Material',
    supplier: { id: 'supplier', name: 'Loja', document: null }, paid: true,
    dueDate: '2026-11-04', paidAt: '2026-11-06T00:00:00Z', quantity: null, unitPrice: null,
    receiptState: 'NONE' };
  const alerts = (purchaseDate = '2026-10-01'): PaymentAlerts => ({ projectId: 'A',
    referenceDate: '2026-11-04', count: 1, totalAmount: 120, items: [{ expenseId: 'expense',
      description: 'Cimento', purchaseDate, dueDate: '2026-11-04', totalPrice: 120, urgency: 'DUE_SOON' }] });
  const el = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
    fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  function click(id: string): void {
    expect(el(id)).withContext(id).not.toBeNull();
    el(id)?.click(); fixture.detectChanges();
  }
  function date(value: string): void {
    const input = el<HTMLInputElement>('payment-date');
    expect(input).not.toBeNull();
    if (!input) return;
    input.value = value; input.dispatchEvent(new Event('input')); input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }
  function open(): void { click('mark-payment-paid'); }
  function failPayment(): void {
    open(); date('2026-11-06'); click('confirm-payment');
    http.expectOne(paymentUrl).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
  }
  function refreshEmpty(): void {
    http.expectOne(alertsUrl).flush({ ...alerts(), count: 0, totalAmount: 0, items: [] });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [HomePage], providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthenticatedIdentityService, useValue: { getUserId: () => 'owner' } },
      { provide: ProjectService, useValue: { getProjects: () => of([project]) } },
      { provide: BudgetService, useValue: { getOverview: () => of({
        projectId: project.id, totalPlanned: 0, totalSpent: 0, available: 0,
        globalPercentage: null, exceededCategories: 0, budgetedCategories: 0, categories: [],
      }) } },
    ] }).compileComponents();
    active = TestBed.inject(ActiveProjectService); active.setActiveProject(project, 'owner');
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(ExpenseService), 'list').and.returnValue(of({
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 }, content: [],
      page: 0, size: 5, totalElements: 0, totalPages: 0,
    }));
    fixture = TestBed.createComponent(HomePage); fixture.detectChanges();
    http.expectOne(alertsUrl).flush(alerts()); fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify(); localStorage.clear(); });

  it('opens a shared accessible modal identifying the account, value and suggested UTC reference date', () => {
    open();
    expect(el('payment-modal')?.getAttribute('role')).toBe('dialog');
    expect(el('payment-modal')?.getAttribute('aria-modal')).toBe('true');
    expect(el('payment-modal')?.textContent).toContain('Cimento');
    expect(el('payment-modal')?.textContent).toContain('120,00');
    expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-04');
    expect(el<HTMLInputElement>('payment-date')?.min).toBe('2026-10-01');
  });

  it('suggests the purchase date when it is later than the reference date', () => {
    fixture.componentInstance.reloadPaymentAlerts(); http.expectOne(alertsUrl).flush(alerts('2026-11-09'));
    fixture.detectChanges(); open();
    expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-09');
  });

  for (const invalid of ['', 'not-a-date', '2026-09-30', '2026-02-30']) {
    it(`blocks invalid payment date ${JSON.stringify(invalid)} with an inline explanation`, () => {
      open(); date(invalid); click('confirm-payment');
      expect(el('payment-date-error')?.textContent?.trim()).toBeTruthy();
      expect(el('payment-date')?.getAttribute('aria-describedby')).toContain('payment-date-error');
      http.expectNone(paymentUrl);
    });
  }

  for (const valid of ['2026-10-01', '2026-12-25']) {
    it(`sends the dedicated PUT with valid civil date ${valid} and refreshes the real Home summary`, () => {
      open(); date(valid); click('confirm-payment');
      const request = http.expectOne(paymentUrl);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({ paymentDate: valid });
      request.flush({ ...expense, paidAt: `${valid}T00:00:00Z` }); fixture.detectChanges();
      expect(el('payment-modal')).toBeNull();
      refreshEmpty();
      expect(el('payment-alert-banner')).toBeNull();
      expect(el('payment-alert-empty')).not.toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Minha obra');
    });
  }

  for (const action of ['cancel-payment', 'close-payment', 'Escape']) {
    it(`discards unsaved fields via ${action} without writing`, () => {
      open(); date('2026-12-25');
      if (action === 'Escape') {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
      } else click(action);
      expect(el('payment-modal')).toBeNull(); http.expectNone(paymentUrl);
      open(); expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-04');
    });
  }

  it('keeps backdrop inert and traps keyboard focus, returning focus to the action after closing', () => {
    const opener = el('mark-payment-paid')!; opener.focus(); open();
    expect(document.activeElement).toBe(el('payment-date'));
    click('payment-backdrop'); expect(el('payment-modal')).not.toBeNull();
    const buttons = el('payment-modal')!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    buttons[buttons.length - 1].focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(el('payment-modal')?.contains(document.activeElement)).toBeTrue();
    click('cancel-payment'); expect(document.activeElement).toBe(opener);
  });

  it('blocks duplicate confirmation and all closing paths until an HTTP outcome', () => {
    open(); click('confirm-payment'); const request = http.expectOne(paymentUrl);
    click('confirm-payment'); click('cancel-payment'); click('close-payment'); click('payment-backdrop');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
    expect(el('payment-modal')).not.toBeNull();
    expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeTrue();
    http.expectNone(paymentUrl);
    request.flush(expense); fixture.detectChanges(); refreshEmpty();
  });

  it('announces the preserved UTC civil paid date without browser timezone conversion', () => {
    open(); date('2026-11-06'); click('confirm-payment');
    http.expectOne(paymentUrl).flush(expense); fixture.detectChanges(); refreshEmpty();
    expect(el('payment-settled-notice')?.textContent).toContain('06/11/2026');
    expect(el('payment-settled-notice')?.textContent).not.toContain('05/11/2026');
  });

  it('distinguishes confirmed settlement from a failed refresh and offers only a new query', () => {
    open(); click('confirm-payment'); http.expectOne(paymentUrl).flush(expense); fixture.detectChanges();
    http.expectOne(alertsUrl).flush({}, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    expect(el('payment-settled-notice')?.textContent).toContain('Pagamento confirmado');
    expect(el('payment-alert-error')?.textContent).toContain('atualização');
    click('retry-payment-alerts'); refreshEmpty(); http.expectNone(paymentUrl);
  });

  it('keeps the date after an uncertain result and requires GET before permitting a manual retry', () => {
    failPayment();
    expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-06');
    expect(el('payment-recovery')?.textContent).toContain('Não foi possível confirmar');
    expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeTrue();
    click('confirm-payment'); http.expectNone(paymentUrl);
    click('reconcile-payment');
    const get = http.expectOne(expenseUrl); expect(get.request.method).toBe('GET');
    get.flush({ ...expense, paid: false, paidAt: null }); fixture.detectChanges();
    expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeFalse(); http.expectNone(paymentUrl);
    click('confirm-payment'); http.expectOne(paymentUrl).flush(expense); fixture.detectChanges(); refreshEmpty();
  });

  it('recovers the first persisted paid date via GET without automatically sending another PUT', () => {
    failPayment(); click('reconcile-payment');
    http.expectOne(expenseUrl).flush({ ...expense, paidAt: '2026-11-05T00:00:00Z' });
    fixture.detectChanges(); refreshEmpty();
    expect(el('payment-modal')).toBeNull();
    expect(el('payment-settled-notice')?.textContent).toContain('05/11/2026'); http.expectNone(paymentUrl);
  });

  for (const status of [404, 503]) {
    it(`retains recovery after reconciliation returns ${status} without claiming settlement`, () => {
      failPayment(); click('reconcile-payment');
      http.expectOne(expenseUrl).flush({}, { status, statusText: 'Failed' }); fixture.detectChanges();
      expect(el('payment-recovery')).not.toBeNull(); expect(el('payment-settled-notice')).toBeNull();
      expect(el<HTMLButtonElement>('reconcile-payment')?.disabled).toBeFalse();
      expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeTrue(); http.expectNone(paymentUrl);
    });
  }

  it('rejects reconciliation of a different project', () => {
    failPayment(); click('reconcile-payment');
    http.expectOne(expenseUrl).flush({ ...expense, projectId: 'B' }); fixture.detectChanges();
    expect(el('payment-recovery')).not.toBeNull(); expect(el('payment-settled-notice')).toBeNull();
    http.expectNone(alertsUrl); http.expectNone(paymentUrl);
  });

  it('requires reconciliation again after closing and reopening an uncertain operation', () => {
    failPayment(); click('cancel-payment'); open();
    expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeTrue();
    expect(el('reconcile-payment')).not.toBeNull(); http.expectNone(paymentUrl);
  });

  it('ends a stalled PUT after 30 seconds and enables recovery without resending', fakeAsync(() => {
    open(); click('confirm-payment'); const request = http.expectOne(paymentUrl);
    tick(30000); fixture.detectChanges();
    expect(request.cancelled).toBeTrue(); expect(el('reconcile-payment')).not.toBeNull();
    expect(el<HTMLButtonElement>('cancel-payment')?.disabled).toBeFalse(); http.expectNone(paymentUrl);
  }));

  it('ends a stalled reconciliation after 30 seconds while keeping recovery available', fakeAsync(() => {
    failPayment(); click('reconcile-payment'); const request = http.expectOne(expenseUrl);
    tick(30000); fixture.detectChanges();
    expect(request.cancelled).toBeTrue();
    expect(el<HTMLButtonElement>('reconcile-payment')?.disabled).toBeFalse();
    expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeTrue(); http.expectNone(paymentUrl);
  }));

  for (const stage of ['PUT', 'GET']) {
    it(`invalidates ${stage} callbacks on A → B → A even before effects run`, () => {
      if (stage === 'GET') { failPayment(); click('reconcile-payment'); }
      else { open(); click('confirm-payment'); }
      const request = http.expectOne(stage === 'GET' ? expenseUrl : paymentUrl);
      active.setActiveProject({ ...project, id: 'B' }, 'owner'); active.setActiveProject(project, 'owner');
      request.flush(expense); fixture.detectChanges();
      expect(el('payment-modal')).toBeNull(); expect(el('payment-settled-notice')).toBeNull();
      http.expectOne(alertsUrl).flush(alerts()); fixture.detectChanges();
      expect(el('payment-alert-banner')).not.toBeNull();
    });
  }

  it('closes the modal on project removal and never sends a payment without an active project', () => {
    open(); active.clear(); fixture.detectChanges();
    expect(el('payment-modal')).toBeNull(); expect(el('mark-payment-paid')).toBeNull();
    http.expectNone(paymentUrl); http.expectNone(alertsUrl);
  });

  for (const stage of ['PUT', 'GET']) {
    it(`lets the interceptor end a ${stage} 401 session without restoring or resending the modal`, () => {
      TestBed.inject(Auth).saveToken('test-session');
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      if (stage === 'GET') { failPayment(); click('reconcile-payment'); }
      else { open(); click('confirm-payment'); }
      const request = http.expectOne(stage === 'GET' ? expenseUrl : paymentUrl);
      expect(request.request.headers.get('Authorization')).toBe('Bearer test-session');
      request.flush({}, { status: 401, statusText: 'Unauthorized' }); fixture.detectChanges();
      expect(active.activeProject()).toBeNull(); expect(TestBed.inject(Auth).getToken()).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'session-expired' } }); expect(el('payment-modal')).toBeNull();
      TestBed.inject(Auth).saveToken('new-session'); active.setActiveProject(project, 'owner');
      fixture.detectChanges(); http.expectOne(alertsUrl).flush(alerts()); fixture.detectChanges();
      expect(el('payment-modal')).toBeNull(); http.expectNone(paymentUrl); http.expectNone(expenseUrl);
    });
  }
});
