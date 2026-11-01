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
        content: [], page: 0, size: 15, totalElements: 60, totalPages: 4, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
      });
      fixture.componentInstance.loadPage(3);
      const previous = http.expectOne(`${url}&page=3&size=15&tab=ALL`);
      fixture.componentInstance.selectTab('PAID');
      http.expectOne(`${url}&page=0&size=15&tab=PAID`).flush({
        content: [expense], page: 0, size: 15, totalElements: 1, totalPages: 1, totals: { totalPaid: 125.5, totalPending: 0, totalGeneral: 125.5 },
      });
      if (lateResponse === 'success') {
        previous.flush({ content: [], page: 3, size: 15, totalElements: 60, totalPages: 4, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
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
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 }, referenceDate: '2026-11-01' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="expense-tab-"]').length).toBe(4);
    fixture.componentInstance.loadPage(3);
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=3&size=15&tab=ALL`)
      .flush({ content: [], page: 3, size: 15, totalElements: 0, totalPages: 1, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
    fixture.componentInstance.selectTab('OVERDUE');
    const request = http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=OVERDUE`);
    expect(fixture.componentInstance.page()).toBe(0);
    request.flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
    expect(fixture.nativeElement.textContent).toContain('Todas');
    expect(fixture.nativeElement.textContent).toContain('Pendentes');
    expect(fixture.nativeElement.textContent).toContain('Vencidas');
    expect(fixture.nativeElement.textContent).toContain('Pagas');
    http.verify();
  });

  it('renders exactly three Brazilian currency totals from all pages and keeps them when paginating', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const totals = { totalPaid: 1601.60, totalPending: 900.90, totalGeneral: 2502.50 };
    const flushPage = (page: number) => {
      http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=${page}&size=15&tab=ALL`)
        .flush({ content: page === 0 ? [expense] : [], page, size: 15, totalElements: 19, totalPages: 2, totals });
      fixture.detectChanges();
    };
    const cardText = (name: string) => {
      const card = fixture.nativeElement.querySelector(`[data-testid="total-${name}"]`);
      return card ? `${card.querySelector('h2').textContent.trim()} ${card.querySelector('p').textContent.trim()}`
        .replace(/\s+/g, ' ') : undefined;
    };
    flushPage(0);
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="total-"]').length).toBe(3);
    expect(cardText('paid')).toBe('Total Pago R$ 1.601,60');
    expect(cardText('pending')).toBe('Total a Pagar R$ 900,90');
    expect(cardText('general')).toBe('Total Geral R$ 2.502,50');
    fixture.componentInstance.loadPage(1);
    flushPage(1);
    expect(cardText('paid')).toBe('Total Pago R$ 1.601,60');
    expect(cardText('pending')).toBe('Total a Pagar R$ 900,90');
    expect(cardText('general')).toBe('Total Geral R$ 2.502,50');
    fixture.componentInstance.selectTab('PAID');
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=PAID`)
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
        totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
    fixture.detectChanges();
    expect(cardText('general')).toBe('Total Geral R$ 0,00');
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
        page: 0, size: 15, totalElements: 1, totalPages: 1, totals: { totalPaid: 125.5, totalPending: 0, totalGeneral: 125.5 },
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
      totalElements: 1, totalPages: 1, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
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
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Não foi possível carregar as despesas');
    http.verify();
  });
  for (const period of ['purchaseDate', 'dueDate']) {
    it(`blocks inverted ${period} interval before HTTP and removes stale results`, () => {
      TestBed.configureTestingModule({ imports: [AccountsPageComponent],
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
      TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
        status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
      const fixture = TestBed.createComponent(AccountsPageComponent); fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      http.expectOne(r => r.url.endsWith('/api/expenses')).flush({ content: [expense], page: 0, totalPages: 1,
        totals: { totalPaid: 125.5, totalPending: 0, totalGeneral: 125.5 } });
      const input = (name: string, value: string) => {
        const field = fixture.nativeElement.querySelector(`[data-testid="filter-${name}"]`);
        expect(field).not.toBeNull();
        if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
      };
      input(`${period}From`, '2026-11-02'); input(`${period}To`, '2026-11-01');
      const form = fixture.nativeElement.querySelector('[data-testid="expense-filters"]');
      expect(form).not.toBeNull(); if (form) form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      http.expectNone(r => r.url.endsWith('/api/expenses'));
      expect(fixture.componentInstance.expenses()).toEqual([]);
      expect(fixture.componentInstance.totals()).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('A data inicial');
      http.match(r => !r.url.endsWith('/api/expenses')).forEach(r => r.flush([])); http.verify();
    });
  }

  it('applies and clears combined filters on first page while preserving the selected tab', () => {
    TestBed.configureTestingModule({ imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const empty = { content: [], page: 0, totalPages: 3, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } };
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty);
    fixture.componentInstance.selectTab('PENDING'); http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty);
    fixture.componentInstance.loadPage(2); http.expectOne(r => r.url.endsWith('/api/expenses')).flush({...empty, page: 2});
    const filtersPanel = fixture.nativeElement.querySelector('[data-testid="filters-panel"]');
    expect(filtersPanel).not.toBeNull();
    if (filtersPanel) { filtersPanel.open = true; filtersPanel.dispatchEvent(new Event('toggle')); }
    http.expectOne(r => r.url.endsWith('/api/expense-categories')).flush([{id: 'c1',name:'Material'}, {id:'c2',name:'Serviço'}]);
    http.expectOne(r => r.url.endsWith('/api/suppliers')).flush([{id:'s1',name:'Loja',document:null}]);
    fixture.detectChanges();
    for (const [name,value] of [['purchaseDateFrom','2026-10-01'], ['purchaseDateTo','2026-10-31'],
      ['dueDateFrom','2026-11-01'], ['dueDateTo','2026-11-30'], ['supplierId','s1']]) {
      const field = fixture.nativeElement.querySelector(`[data-testid="filter-${name}"]`);
      expect(field).not.toBeNull(); if(field) { field.value=value; field.dispatchEvent(new Event(name==='supplierId'?'change':'input')); }
    }
    const category = fixture.nativeElement.querySelector('[data-testid="filter-categoryIds"]');
    expect(category).not.toBeNull(); if(category) { Array.from(category.options as HTMLOptionsCollection).forEach(o => o.selected=true); category.dispatchEvent(new Event('change')); }
    const form = fixture.nativeElement.querySelector('[data-testid="expense-filters"]');
    expect(form).not.toBeNull(); if(form) form.dispatchEvent(new Event('submit'));
    const request = http.expectOne(r => r.url.endsWith('/api/expenses'));
    expect(request.request.params.get('page')).toBe('0'); expect(request.request.params.get('tab')).toBe('PENDING');
    expect(request.request.params.get('purchaseDateFrom')).toBe('2026-10-01');
    expect(request.request.params.get('purchaseDateTo')).toBe('2026-10-31');
    expect(request.request.params.get('dueDateFrom')).toBe('2026-11-01');
    expect(request.request.params.get('dueDateTo')).toBe('2026-11-30');
    expect(request.request.params.getAll('categoryIds')).toEqual(['c1','c2']);
    expect(request.request.params.get('supplierId')).toBe('s1'); request.flush(empty);
    const clear = fixture.nativeElement.querySelector('[data-testid="clear-filters"]');
    expect(clear).not.toBeNull(); if(clear) clear.click();
    const cleared=http.expectOne(r=>r.url.endsWith('/api/expenses'));
    expect(cleared.request.params.keys()).toEqual(['projectId','page','size','tab']);
    expect(cleared.request.params.get('tab')).toBe('PENDING'); expect(cleared.request.params.get('page')).toBe('0');
    cleared.flush(empty); http.verify();
  });

});
