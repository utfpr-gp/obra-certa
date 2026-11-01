import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AccountsPageComponent } from './accounts-page.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ExpenseResponse } from '../../core/models/expense-registration.model';

const expense: ExpenseResponse = {
  id: 'expense-1', projectId: 'project', description: 'Cimento',
  categoryId: 'category', categoryName: 'Material',
  supplier: { id: 'supplier', name: 'Loja', document: null },
  purchaseDate: '2026-01-01', dueDate: null, totalPrice: 125.5,
  paid: true, quantity: null, unitPrice: null, receiptState: 'NONE',
};

describe('AccountsPageComponent', () => {
  beforeAll(() => registerLocaleData(localePt));
  for (const lateResponse of ['success', 'error'] as const) {
    it(`ignores delayed ${lateResponse} from the previous tab after returning to its first page`, () => {
      TestBed.configureTestingModule({
        imports: [AccountsPageComponent],
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      });
      TestBed.inject(ActiveProjectService).setActiveProject({
        id: 'project', name: 'Casa', type: 'RENOVATION', status: 'IN_PROGRESS',
        location: null, createdAt: '', updatedAt: '',
      }, 'owner');
      const fixture = TestBed.createComponent(AccountsPageComponent);
      fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      const url = `${environment.apiUrl}/api/expenses?projectId=project`;
      http.expectOne(`${url}&page=0&size=15&tab=ALL`).flush({
        content: [], page: 0, size: 15, totalElements: 60, totalPages: 4,
      });
      fixture.componentInstance.loadPage(3);
      const previous = http.expectOne(`${url}&page=3&size=15&tab=ALL`);
      fixture.componentInstance.selectTab('PAID');
      http.expectOne(`${url}&page=0&size=15&tab=PAID`).flush({
        content: [expense], page: 0, size: 15, totalElements: 1, totalPages: 1,
      });
      if (lateResponse === 'success') {
        previous.flush({ content: [], page: 3, size: 15, totalElements: 60, totalPages: 4 });
      } else {
        previous.flush({}, { status: 503, statusText: 'Unavailable' });
      }
      fixture.detectChanges();
      expect(fixture.componentInstance.page()).toBe(0);
      expect(fixture.componentInstance.totalPages()).toBe(1);
      expect(fixture.componentInstance.expenses()).toEqual([expense]);
      expect(fixture.componentInstance.error()).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="expense-tab-PAID"]').getAttribute('aria-selected')).toBe('true');
      http.verify();
    });
  }
  it('keeps all four situation tabs available, changes tab and resets to first page', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const active = TestBed.inject(ActiveProjectService);
    active.setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL`)
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0, referenceDate: '2026-11-01' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="expense-tab-"]').length).toBe(4);
    fixture.componentInstance.loadPage(3);
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=3&size=15&tab=ALL`)
      .flush({ content: [], page: 3, size: 15, totalElements: 0, totalPages: 1 });
    fixture.componentInstance.selectTab('OVERDUE');
    const request = http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=OVERDUE`);
    expect(fixture.componentInstance.page()).toBe(0);
    request.flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0 });
    expect(fixture.nativeElement.textContent).toContain('Todas');
    expect(fixture.nativeElement.textContent).toContain('Pendentes');
    expect(fixture.nativeElement.textContent).toContain('Vencidas');
    expect(fixture.nativeElement.textContent).toContain('Pagas');
    http.verify();
  });

  it('renders expense fields, pagination, individual link and registration action', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const active = TestBed.inject(ActiveProjectService);
    active.setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL`)
      .flush({
        content: [expense],
        page: 0, size: 15, totalElements: 1, totalPages: 1,
      });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cimento');
    expect(fixture.nativeElement.textContent).toContain('Material');
    expect(fixture.nativeElement.textContent).toContain('Loja');
    expect(fixture.nativeElement.querySelector('a[href="/despesas/expense-1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="pagination"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="create-account"]')).not.toBeNull();
    http.verify();
  });

  it('clears stale results, shows a readable error and retries the same page', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const active = TestBed.inject(ActiveProjectService);
    active.setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const first = http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL`);
    first.flush({ content: [{ ...expense, id: 'old', description: 'Antiga' }], page: 0, size: 15,
      totalElements: 1, totalPages: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Antiga');

    fixture.componentInstance.loadPage(0);
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL`)
      .flush({ message: 'falha' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Antiga');
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar as despesas');
    expect(fixture.nativeElement.querySelector('[data-testid="retry-expenses"]')).not.toBeNull();

    fixture.componentInstance.retry();
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL`)
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Não foi possível carregar as despesas');
    http.verify();
  });
});
