import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountsPageComponent } from './accounts-page.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ExpensePageResponse, ExpenseResponse } from '../../core/models/expense-registration.model';
import { Project, ProjectStatus, ProjectType } from '../../core/models/project.model';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { Auth } from '../../core/services/auth';

const expense: ExpenseResponse = {
  id: 'expense-1', projectId: 'project', description: 'Cimento',
  categoryId: 'category', categoryName: 'Material',
  supplier: { id: 'supplier', name: 'Loja', document: null },
  purchaseDate: '2026-01-01', dueDate: null, totalPrice: 125.5,
  paid: true, quantity: null, unitPrice: null, receiptState: 'NONE',
};

describe('AccountsPageComponent', () => {
  beforeAll(() => registerLocaleData(localePt));
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
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL&sort=PURCHASE_DATE_DESC`)
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 }, referenceDate: '2026-11-01' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="expense-tab-"]').length).toBe(4);
    fixture.componentInstance.loadPage(3);
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=3&size=15&tab=ALL&sort=PURCHASE_DATE_DESC`)
      .flush({ content: [], page: 3, size: 15, totalElements: 0, totalPages: 1, totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
    fixture.componentInstance.selectTab('OVERDUE');
    const request = http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=OVERDUE&sort=PURCHASE_DATE_DESC`);
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
      http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=${page}&size=15&tab=ALL&sort=PURCHASE_DATE_DESC`)
        .flush({ content: page === 0 ? [expense] : [], page, size: 15, totalElements: 19, totalPages: 2, totals });
      fixture.detectChanges();
    };
    flushPage(0);
    expect(fixture.nativeElement.querySelector('[data-testid="pagination"]').textContent).toContain('19 registros no resultado');
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="total-"]').length).toBe(3);
    expect(fixture.componentInstance.totals()).toEqual(totals);
    fixture.componentInstance.loadPage(1);
    flushPage(1);
    expect(fixture.componentInstance.totals()).toEqual(totals);
    fixture.componentInstance.selectTab('PAID');
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=PAID&sort=PURCHASE_DATE_DESC`)
      .flush({ content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
        totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } });
    fixture.detectChanges();
    expect(fixture.componentInstance.totals()).toEqual({ totalPaid: 0, totalPending: 0, totalGeneral: 0 });
    for (const card of fixture.nativeElement.querySelectorAll('[data-testid^="total-"]')) {
      expect((card as HTMLElement).textContent).toMatch(/R\$\s*0,00/);
    }
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
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
    http.expectOne(`${environment.apiUrl}/api/expenses?projectId=project&page=0&size=15&tab=ALL&sort=PURCHASE_DATE_DESC`)
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
    expect(fixture.nativeElement.querySelector('[data-testid="pagination"]').textContent).toContain('1 registro no resultado');
    expect(fixture.nativeElement.querySelector('[data-testid="create-account"]')).not.toBeNull();
    http.verify();
  });

  it('shows a readable error with a manual retry action', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({ message: 'falha' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar as despesas');
    expect(fixture.nativeElement.querySelector('[data-testid="retry-expenses"]')).not.toBeNull();
    http.verify();
  });

  it('guides the owner when the project has no expenses and keeps zero totals visible', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="empty-project"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cadastre sua primeira conta');
    expect(fixture.nativeElement.querySelector('[data-testid="create-account"]')).not.toBeNull();
    expect(fixture.componentInstance.totals()).toEqual({ totalPaid: 0, totalPending: 0, totalGeneral: 0 });
    http.verify();
  });

  it('distinguishes an empty tab or filter result and offers clearing the applied filters', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [expense], page: 0, size: 15, totalElements: 1, totalPages: 1,
      totals: { totalPaid: 125.5, totalPending: 0, totalGeneral: 125.5 },
    });
    fixture.componentInstance.filters.set({ supplierId: 'supplier' });
    fixture.componentInstance.selectTab('PENDING');
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="empty-results"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Nenhum resultado encontrado');
    expect(fixture.nativeElement.querySelector('[data-testid="clear-filters"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="expense-tab-PENDING"]').getAttribute('aria-selected')).toBe('true');
    http.verify();
  });

  it('offers registration in a filtered tab only when the project has no expenses at all', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
    });
    fixture.componentInstance.selectTab('PENDING');
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="empty-project"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cadastre sua primeira conta');
    http.verify();
  });

  it('does not claim the project is empty when an invalid interval blocks the query', () => {
    TestBed.configureTestingModule({ imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({ content: [expense], page: 0, size: 15, totalElements: 1, totalPages: 1,
      totals: { totalPaid: 125.5, totalPending: 0, totalGeneral: 125.5 } });
    const input = (name: string, value: string) => {
      const field = fixture.nativeElement.querySelector(`[data-testid="filter-${name}"]`);
      expect(field).not.toBeNull();
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    };
    input('purchaseDateFrom', '2026-11-02'); input('purchaseDateTo', '2026-11-01');
    const form = fixture.nativeElement.querySelector('[data-testid="expense-filters"]');
    if (form) form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http.expectNone(r => r.url.endsWith('/api/expenses'));
    expect(fixture.nativeElement.querySelector('[data-testid="empty-project"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="empty-results"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Nenhuma despesa cadastrada');
    http.verify();
  });

  it('identifies loading state while the expense response is pending', () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="expenses-loading"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="total-"]').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[aria-label="Totalizadores das despesas"]').getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.textContent).not.toMatch(/R\$\s*0,00/);
    expect(fixture.nativeElement.querySelector('[data-testid="mark-expense-paid"]')).toBeNull();
    TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
    });
  });

  for (const width of [360, 1280]) {
  it(`renders every CA1 field per expense and keeps actions usable in a real ${width}px viewport`, async () => {
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '',
    }, 'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const pendingExpense: ExpenseResponse = {
      ...expense, id: 'expense-2', description: 'Instalação elétrica',
      categoryId: 'service', categoryName: 'Serviço',
      supplier: { id: 'electrician', name: 'Eletricista', document: null },
      purchaseDate: '2026-10-21', dueDate: '2026-11-10', totalPrice: 2345.67, paid: false,
    };
    const content = [expense, pendingExpense];
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content, page: 0, size: 15, totalElements: 2, totalPages: 1,
      totals: { totalPaid: 125.5, totalPending: 2345.67, totalGeneral: 2471.17 },
    });
    fixture.detectChanges();
    // An iframe has its own layout viewport: CSS media queries use this width.
    const frame = document.createElement('iframe');
    frame.style.cssText = `position:fixed;top:0;left:0;width:${width}px;height:900px;border:0`;
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write('<!doctype html><html><head></head><body></body></html>');
    doc.close();
    try {
      // Karma may inject global stylesheet links in the body of its context page.
      const styles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'));
      expect(styles.length).toBeGreaterThan(0);
      await Promise.all(styles.map(source => {
        const clone = source.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;
        const loaded = clone instanceof HTMLLinkElement
          ? new Promise<void>((resolve, reject) => { clone.onload = () => resolve(); clone.onerror = () => reject(new Error('Viewport styles failed to load')); })
          : Promise.resolve();
        doc.head.appendChild(clone);
        return loaded;
      }));
      doc.body.style.margin = '0';
      // The application's main layout scrolls its overflow-y-auto container.
      const scrollContainer = doc.createElement('div');
      scrollContainer.style.cssText = 'height:900px;overflow-y:auto';
      doc.body.appendChild(scrollContainer);
      scrollContainer.appendChild(fixture.nativeElement);
      expect(frame.contentWindow!.innerWidth).toBe(width);
      expect(frame.contentWindow!.getComputedStyle(doc.documentElement).getPropertyValue('--spacing').trim()).toBe('0.25rem');
      const root = fixture.nativeElement as HTMLElement;
      const header = root.querySelector('header')!;
      expect(header.querySelector('h1')?.textContent).toBe('Contas a Pagar');
      expect(header.textContent).toContain('Acompanhe os compromissos da obra e mantenha o histórico de quitações.');
      expect(header.querySelector('[data-testid="create-account"]')).not.toBeNull();
      expect(root.querySelector('#new-account-title')).toBeNull();
      const listPanel = root.querySelector('[aria-labelledby="accounts-list-title"]');
      expect(listPanel).not.toBeNull();
      expect(listPanel?.querySelector('#accounts-list-title')?.textContent).toBe('Compromissos e histórico');
      expect(listPanel?.querySelector('[data-testid="filters-panel"]')).not.toBeNull();
      expect(listPanel?.querySelector('[data-testid="expense-sort"]')).not.toBeNull();
      expect(Array.from(root.querySelectorAll('[data-testid^="total-"] h2'), node => node.textContent))
        .toEqual(['Total a Pagar', 'Total Pago', 'Total Geral']);
      expect(header.querySelector('h1') && frame.contentWindow!.getComputedStyle(header.querySelector('h1')!).fontSize).toBe('24px');
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(width + 1);
      };
      const panel = root.querySelector('[data-testid="filters-panel"]') as HTMLDetailsElement;
      const filterToggle = panel.querySelector('summary')!;
      expect(frame.contentWindow!.getComputedStyle(filterToggle).listStyleType).toBe('none');
      expect(filterToggle.querySelector('svg')).not.toBeNull();
      filterToggle.click();
      expect(panel.open).toBeTrue();
      filterToggle.click();
      expect(panel.open).toBeFalse();
      filterToggle.click();
      expect(panel.open).toBeTrue();
      panel.dispatchEvent(new Event('toggle'));
      http.expectOne(r => r.url.endsWith('/api/expense-categories')).flush([{id:'category',name:'Material'}]);
      http.expectOne(r => r.url.endsWith('/api/suppliers')).flush([{id:'supplier',name:'Loja',document:null}]);
      fixture.detectChanges();
      for (const control of root.querySelectorAll('input,select,[role="tab"],[data-testid^="total-"],[data-testid="create-account"]')) visible(control);
      const date = root.querySelector('[data-testid="filter-purchaseDateFrom"]') as HTMLInputElement;
      date.value = '2026-01-01'; date.dispatchEvent(new Event('input'));
      root.querySelector('form')!.dispatchEvent(new Event('submit'));
      const filtered = http.expectOne(r => r.url.endsWith('/api/expenses'));
      expect(filtered.request.params.get('purchaseDateFrom')).toBe('2026-01-01');
      filtered.flush({content,page:0,size:15,totalElements:2,totalPages:1,
        totals:{totalPaid:125.5,totalPending:2345.67,totalGeneral:2471.17}});
      fixture.detectChanges();
      const rows = root.querySelector(width < 640 ? '[data-testid="expense-cards"]' : 'table');
      expect(rows).not.toBeNull();
      if (rows) {
        visible(rows);
        const records = rows.querySelectorAll(width < 640 ? 'article' : 'tbody tr');
        expect(records.length).toBe(2);
        const expectedRecords = [
          { id: 'expense-1', description: 'Cimento', category: 'Material', supplier: 'Loja',
            purchase: '01/01/2026', due: '—', price: 'R$ 125,50', status: 'Pago' },
          { id: 'expense-2', description: 'Instalação elétrica', category: 'Serviço', supplier: 'Eletricista',
            purchase: '21/10/2026', due: '10/11/2026', price: 'R$ 2.345,67', status: 'Pendente' },
        ];
        const text = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ').trim();
        const assertCompactAction = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          const style = frame.contentWindow!.getComputedStyle(element);
          expect(rect.height).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeLessThanOrEqual(48);
          expect(rect.width).toBeLessThanOrEqual(160);
          expect(style.fontSize).toBe('12px');
          expect(style.paddingLeft).toBe('12px');
          expect(style.paddingRight).toBe('12px');
          expect(style.paddingTop).toBe('8px');
          expect(style.paddingBottom).toBe('8px');
        };
        expectedRecords.forEach((expected, index) => {
          const record = records[index];
          expect(record).toBeDefined();
          if (!record) return;
          visible(record);
          const fields = [expected.category, expected.supplier, expected.purchase,
            expected.due, expected.price, expected.status];
          if (width < 640) {
            expect(text(record.querySelector('h3'))).toBe(expected.description);
            expect(Array.from(record.querySelectorAll('dt'), text))
              .toEqual(['Categoria', 'Fornecedor', 'Compra', 'Vencimento', 'Valor', 'Situação']);
            expect(Array.from(record.querySelectorAll('dd'), text)).toEqual(fields);
          } else {
            expect(Array.from(record.querySelectorAll('td'), text).slice(0, -1))
              .toEqual([expected.description, ...fields]);
          }
          const link = record.querySelector('a')!;
          expect(link).not.toBeNull();
          expect(text(link)).toBe('Ver detalhes');
          expect(link.classList.contains('btn-oc-outline')).toBeTrue();
          expect(link.classList.contains('min-h-11')).toBeTrue();
          expect(link.classList.contains('underline')).toBeFalse();
          expect(link.classList.contains('text-primary-oc')).toBeFalse();
          expect(link.getAttribute('role')).toBeNull();
          visible(link);
          assertCompactAction(link);
          expect(link.getAttribute('href')).toBe(`/despesas/${expected.id}`);
          const markPaid = record.querySelector<HTMLButtonElement>('[data-testid="mark-expense-paid"]');
          if (index === 0) {
            expect(markPaid).toBeNull();
          } else {
            expect(markPaid).not.toBeNull();
            if (markPaid) {
              expect(text(markPaid)).toBe('Marcar como Pago');
              expect(markPaid.type).toBe('button');
              expect(markPaid.disabled).toBeFalse();
              expect(markPaid.classList.contains('btn-oc-outline')).toBeTrue();
              visible(markPaid);
              assertCompactAction(markPaid);
              const router = TestBed.inject(Router);
              const previousUrl = router.url;
              markPaid.click();
              fixture.detectChanges();
              expect(root.querySelector('[data-testid="payment-modal"]')).not.toBeNull();
              (root.querySelector('[data-testid="cancel-payment"]') as HTMLButtonElement).click();
              fixture.detectChanges();
              expect(root.querySelector('[data-testid="payment-modal"]')).toBeNull();
              http.expectNone(() => true);
              expect(fixture.componentInstance.expenses()).toEqual(content);
              expect(router.url).toBe(previousUrl);
            }
          }
        });
      }
      const create = root.querySelector('[data-testid="create-account"]')!;
      expect(create.getAttribute('href')).toBe('/contas/nova');
      expect(create.textContent?.trim()).toBe('Cadastrar conta');
      expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(width);
      const stableElements = [header, listPanel!, panel, root.querySelector('[data-testid="expense-tabs"]')!,
        ...Array.from(root.querySelectorAll('[data-testid^="total-"]'))];
      const assertPendingTransition = (action: () => void, expected: Record<string, string>, responsePage = 0) => {
        scrollContainer.scrollTop = 200;
        const scrollTop = scrollContainer.scrollTop;
        expect(scrollTop).toBeGreaterThan(0);
        const rects = stableElements.map(element => element.getBoundingClientRect());
        const resultsPanel = root.querySelector('#expenses-panel')!;
        const oldHeight = resultsPanel.getBoundingClientRect().height;
        const table = root.querySelector('table');
        const headings = Array.from(root.querySelectorAll('thead th'));
        const records = Array.from(root.querySelectorAll(width < 640 ? '[data-testid="expense-cards"] article' : 'tbody tr'));
        const recordRects = records.map(record => record.getBoundingClientRect());
        action();
        const request = http.expectOne(r => r.url.endsWith('/api/expenses'));
        expect(request.request.method).toBe('GET');
        for (const [key, value] of Object.entries(expected)) expect(request.request.params.get(key)).toBe(value);
        http.expectNone(r => r.url.endsWith('/api/expenses'));
        fixture.detectChanges();
        expect(root.querySelector('[data-testid="mark-expense-paid"]')).toBeNull();
        stableElements.forEach((element, index) => {
          expect(root.contains(element)).toBeTrue();
          const rect = element.getBoundingClientRect();
          expect(rect.top).toBeCloseTo(rects[index].top, 0);
          expect(rect.height).toBeCloseTo(rects[index].height, 0);
        });
        expect(root.querySelector('#expenses-panel')).toBe(resultsPanel);
        expect(scrollContainer.scrollTop).toBe(scrollTop);
        expect(root.querySelector('table')).toBe(table);
        const pendingHeadings = Array.from(root.querySelectorAll('thead th'));
        expect(pendingHeadings.length).toBe(headings.length);
        headings.forEach((heading, index) => expect(pendingHeadings[index]).toBe(heading));
        expect(headings.map(heading => heading.textContent?.trim()))
          .toEqual(['Descrição', 'Categoria', 'Fornecedor', 'Compra', 'Vencimento', 'Valor', 'Situação', 'Ações']);
        const pendingRecords = Array.from(root.querySelectorAll(width < 640 ? '[data-testid="expense-cards"] article' : 'tbody tr'));
        expect(pendingRecords.length).toBe(records.length);
        records.forEach((record, index) => expect(pendingRecords[index]).toBe(record));
        pendingRecords.forEach((record, index) => {
          expect(record.getBoundingClientRect().height).toBeCloseTo(recordRects[index].height, 0);
          expect(record.querySelector('a')).toBeNull();
          expect(record.querySelectorAll('.account-skeleton').length).toBeGreaterThanOrEqual(7);
          if (width < 640) expect(Array.from(record.querySelectorAll('dt'), node => node.textContent))
            .toEqual(['Categoria', 'Fornecedor', 'Compra', 'Vencimento', 'Valor', 'Situação']);
        });
        expect(resultsPanel.getBoundingClientRect().height).toBeCloseTo(oldHeight, 0);
        expect(resultsPanel.getAttribute('aria-busy')).toBe('true');
        expect(resultsPanel.querySelector('[data-testid="expenses-loading"][role="status"]')).not.toBeNull();
        expect(root.querySelector('[aria-label="Totalizadores das despesas"]')?.getAttribute('aria-busy')).toBe('true');
        expect(root.textContent).not.toContain('Cimento');
        expect(root.textContent).not.toContain('Instalação elétrica');
        expect(root.textContent).not.toMatch(/R\$\s*(125,50|2\.345,67|2\.471,17|0,00)/);
        expect(resultsPanel.textContent).not.toContain('de 2');
        expect(fixture.componentInstance.expenses()).toEqual([]);
        expect(fixture.componentInstance.totals()).toBeNull();
        expect(root.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('id')).toBe('expense-tab-' + expected['tab']);
        request.flush({content,page:responsePage,size:15,totalElements:20,totalPages:2,
          totals:{totalPaid:125.5,totalPending:2345.67,totalGeneral:2471.17}});
        fixture.detectChanges();
        expect(root.querySelector('[data-testid="expenses-loading"]')).toBeNull();
        expect(root.querySelector('#expenses-panel')?.getAttribute('aria-busy')).toBe('false');
        expect(root.textContent).toContain('Cimento');
        expect(root.querySelector('[data-testid="total-general"]')?.textContent).toMatch(/R\$\s*2\.471,17/);
      };
      assertPendingTransition(() => (root.querySelector('[data-testid="expense-tab-PENDING"]') as HTMLButtonElement).click(),
        {tab:'PENDING',page:'0',purchaseDateFrom:'2026-01-01'});
      assertPendingTransition(() => root.querySelector('form')!.dispatchEvent(new Event('submit')),
        {tab:'PENDING',page:'0',purchaseDateFrom:'2026-01-01'});
      assertPendingTransition(() => {
        const sort = root.querySelector('[data-testid="expense-sort"]') as HTMLSelectElement;
        sort.value = 'AMOUNT_DESC'; sort.dispatchEvent(new Event('change'));
      }, {tab:'PENDING',page:'0',sort:'AMOUNT_DESC',purchaseDateFrom:'2026-01-01'});
      assertPendingTransition(() => (root.querySelector('[data-testid="pagination"] button:last-child') as HTMLButtonElement).click(),
        {tab:'PENDING',page:'1',sort:'AMOUNT_DESC',purchaseDateFrom:'2026-01-01'}, 1);
      assertPendingTransition(() => (root.querySelector('[data-testid="expense-tab-PAID"]') as HTMLButtonElement).click(),
        {tab:'PAID',page:'0',sort:'AMOUNT_DESC',purchaseDateFrom:'2026-01-01'});
      assertPendingTransition(() => (root.querySelector('[data-testid="expense-tab-PENDING"]') as HTMLButtonElement).click(),
        {tab:'PENDING',page:'0',sort:'AMOUNT_DESC',purchaseDateFrom:'2026-01-01'});
    expect(fixture.nativeElement.querySelector('[data-testid="expense-tabs"]').getAttribute('role')).toBe('tablist');
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]').length).toBe(4);
    expect(fixture.nativeElement.querySelector('[role="tab"][aria-selected="true"]').getAttribute('aria-controls')).toBe('expenses-panel');
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby')).toBe('expense-tab-PENDING');
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="total-"]').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[data-testid="filters-panel"] summary').className).toContain('min-h-11');
    expect(fixture.nativeElement.querySelector('[data-testid="create-account"]').className).toContain('min-h-11');
    expect(fixture.nativeElement.querySelector('[data-testid="pagination"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="filter-categoryIds"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="filter-supplierId"]')).not.toBeNull();
    fixture.nativeElement.querySelector('[data-testid="expense-tab-PAID"]').click();
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({
      content: [], page: 0, size: 15, totalElements: 0, totalPages: 0,
      totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="expense-tab-PAID"]').getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    const clear = root.querySelector('[data-testid="clear-empty-filters"]') as HTMLButtonElement;
    visible(clear); clear.click();
    const cleared = http.expectOne(r => r.url.endsWith('/api/expenses'));
    expect(cleared.request.params.get('purchaseDateFrom')).toBeNull();
    expect(cleared.request.params.get('tab')).toBe('PAID');
    cleared.flush({content:[],page:0,totalPages:0,totals:{totalPaid:0,totalPending:0,totalGeneral:0}});
    http.verify();
    } finally { frame.remove(); }
  });
  }

  it('supports arrow, Home and End keys with one selected focusable tab', () => {
    TestBed.configureTestingModule({imports:[AccountsPageComponent], providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});
    TestBed.inject(ActiveProjectService).setActiveProject({id:'project',name:'Casa',type:'RENOVATION',status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''},'owner');
    const fixture = TestBed.createComponent(AccountsPageComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const empty = {content:[],page:0,totalPages:0,totals:{totalPaid:0,totalPending:0,totalGeneral:0}};
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty); fixture.detectChanges();
    for (const [key, tab] of [['ArrowRight','PENDING'],['End','PAID'],['ArrowRight','ALL'],['ArrowLeft','PAID'],['Home','ALL']]) {
      const selected = fixture.nativeElement.querySelector('[role="tab"][aria-selected="true"]') as HTMLButtonElement;
      selected.focus(); selected.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
      expect(fixture.componentInstance.tab()).toBe(tab);
      http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty); fixture.detectChanges();
      const current = fixture.nativeElement.querySelector('[role="tab"][aria-selected="true"]');
      expect(document.activeElement).toBe(current);
      expect(current.tabIndex).toBe(0);
      expect(fixture.nativeElement.querySelectorAll('[role="tab"][tabindex="-1"]').length).toBe(3);
    }
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

  for (const period of ['purchaseDate', 'dueDate']) {
    for (const outcome of ['success', 'error']) {
      it(`ends loading for inverted ${period} while a prior ${outcome} response is pending`, () => {
        TestBed.configureTestingModule({ imports: [AccountsPageComponent],
          providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
        TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
          status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
        const fixture = TestBed.createComponent(AccountsPageComponent);
        fixture.detectChanges();
        const http = TestBed.inject(HttpTestingController);
        const pending = http.expectOne(r => r.url.endsWith('/api/expenses'));
        expect(fixture.componentInstance.loading()).toBeTrue();
        expect(fixture.nativeElement.querySelector('[data-testid="expenses-loading"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('[role="tabpanel"]').getAttribute('aria-busy')).toBe('true');

        fixture.componentInstance.filterForm.patchValue({
          [`${period}From`]: '2026-11-02', [`${period}To`]: '2026-11-01',
        });
        fixture.nativeElement.querySelector('[data-testid="expense-filters"]').dispatchEvent(new Event('submit'));
        fixture.detectChanges();
        const expectInvalidState = () => {
          expect(fixture.componentInstance.loading()).toBeFalse();
          expect(fixture.nativeElement.querySelector('[data-testid="expenses-loading"]')).toBeNull();
          expect(fixture.nativeElement.querySelector('[role="tabpanel"]').getAttribute('aria-busy')).toBe('false');
          expect(fixture.nativeElement.querySelector(`#${period}-error`)).not.toBeNull();
          expect(fixture.componentInstance.expenses()).toEqual([]);
          expect(fixture.componentInstance.totals()).toBeNull();
          expect(fixture.componentInstance.error()).toBeNull();
        };
        http.expectNone(r => r.url.endsWith('/api/expenses'));
        expectInvalidState();

        if (outcome === 'success') {
          pending.flush({ content: [expense], page: 0, totalPages: 1,
            totals: { totalPaid: 125.5, totalPending: 0, totalGeneral: 125.5 } });
        } else {
          pending.flush({}, { status: 500, statusText: 'Server Error' });
        }
        fixture.detectChanges();
        expectInvalidState();
        http.verify();
      });
    }
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
    expect(cleared.request.params.keys()).toEqual(['projectId','page','size','tab','sort']);
    expect(cleared.request.params.get('tab')).toBe('PENDING'); expect(cleared.request.params.get('page')).toBe('0');
    cleared.flush(empty); http.verify();
  });

  for (const order of ['PURCHASE_DATE_ASC', 'AMOUNT_DESC', 'AMOUNT_ASC', 'PURCHASE_DATE_DESC']) {
    it(`selects ${order} on first page while retaining tab and applied filters`, () => {
      TestBed.configureTestingModule({ imports: [AccountsPageComponent],
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
      TestBed.inject(ActiveProjectService).setActiveProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
        status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
      const fixture = TestBed.createComponent(AccountsPageComponent); fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      const empty = {content: [], page: 0, totalPages: 3, totals: {totalPaid: 0, totalPending: 0, totalGeneral: 0}};
      const initial = http.expectOne(r => r.url.endsWith('/api/expenses'));
      expect(initial.request.params.get('sort')).toBe('PURCHASE_DATE_DESC'); initial.flush(empty);
      const control = fixture.nativeElement.querySelector('[data-testid="expense-sort"]') as HTMLSelectElement | null;
      expect(control).not.toBeNull();
      if (!control) { http.verify(); return; }
      expect(control.value).toBe('PURCHASE_DATE_DESC');
      expect(Array.from(control.options).map(o => o.value)).toEqual([
        'PURCHASE_DATE_DESC', 'PURCHASE_DATE_ASC', 'AMOUNT_DESC', 'AMOUNT_ASC']);
      expect(fixture.nativeElement.querySelector('label[for="expense-sort"]').textContent).toContain('Ordenar por');
      fixture.componentInstance.selectTab('PENDING'); http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty);
      fixture.componentInstance.filterForm.patchValue({purchaseDateFrom:'2026-10-01',purchaseDateTo:'2026-10-31',
        dueDateFrom:'2026-11-01',dueDateTo:'2026-11-30',categoryIds:['c1','c2'],supplierId:'s1'});
      fixture.componentInstance.applyFilters(); http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty);
      if (order === 'PURCHASE_DATE_DESC') {
        control.value = 'AMOUNT_ASC'; control.dispatchEvent(new Event('change'));
        http.expectOne(r => r.url.endsWith('/api/expenses')).flush(empty);
      }
      fixture.componentInstance.loadPage(2);
      const obsolete = http.expectOne(r => r.url.endsWith('/api/expenses'));
      obsolete.flush({...empty,page:2});
      fixture.componentInstance.loadPage(1);
      const delayed = http.expectOne(r => r.url.endsWith('/api/expenses'));
      control.value = order; control.dispatchEvent(new Event('change'));
      expect(fixture.componentInstance.page()).toBe(0);
      const current = http.expectOne(r => r.url.endsWith('/api/expenses'));
      expect(current.request.params.get('sort')).toBe(order);
      expect(current.request.params.get('page')).toBe('0'); expect(current.request.params.get('tab')).toBe('PENDING');
      for (const [key,value] of Object.entries({purchaseDateFrom:'2026-10-01',purchaseDateTo:'2026-10-31',
        dueDateFrom:'2026-11-01',dueDateTo:'2026-11-30',supplierId:'s1'})) expect(current.request.params.get(key)).toBe(value);
      expect(current.request.params.getAll('categoryIds')).toEqual(['c1','c2']);
      current.flush({...empty,content:[expense],totals:{totalPaid:125.5,totalPending:0,totalGeneral:125.5}});
      delayed.flush({...empty,page:1}); fixture.detectChanges();
      expect(fixture.componentInstance.page()).toBe(0); expect(fixture.componentInstance.expenses()).toEqual([expense]);
      expect(control.value).toBe(order);
      expect(fixture.nativeElement.querySelector('[data-testid="expense-tab-PENDING"]').getAttribute('aria-selected')).toBe('true');
      fixture.componentInstance.loadPage(1);
      const next = http.expectOne(r => r.url.endsWith('/api/expenses'));
      expect(next.request.params.get('sort')).toBe(order); next.flush({...empty,page:1});
      http.verify();
    });
  }

});

describe('AccountsPageComponent payment flow', () => {
  beforeAll(() => registerLocaleData(localePt));
  let fixture: ComponentFixture<AccountsPageComponent>;
  let http: HttpTestingController;
  let active: ActiveProjectService;
  const listUrl = `${environment.apiUrl}/api/expenses`;
  const paymentUrl = `${environment.apiUrl}/api/projects/project/expenses/expense-2/payment`;
  const expenseUrl = `${environment.apiUrl}/api/expenses/expense-2`;
  const project: Project = { id: 'project', name: 'Casa', type: ProjectType.RENOVATION,
    status: ProjectStatus.IN_PROGRESS, location: null, createdAt: '', updatedAt: '' };
  const pendingExpense: ExpenseResponse = {
    id: 'expense-2', projectId: 'project', description: 'Instalação elétrica',
    categoryId: 'service', categoryName: 'Serviço',
    supplier: { id: 'electrician', name: 'Eletricista', document: null },
    purchaseDate: '2026-10-21', dueDate: '2026-11-10', totalPrice: 2345.67, paid: false,
    quantity: null, unitPrice: null, receiptState: 'NONE',
  };
  const paidExpense: ExpenseResponse = { ...pendingExpense, paid: true, paidAt: '2026-11-06T00:00:00Z' };
  const zeroTotals = { totalPaid: 0, totalPending: 0, totalGeneral: 0 };

  function setup(withInterceptor = false): void {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [
        provideHttpClient(withInterceptors(withInterceptor ? [authInterceptor] : [])),
        provideHttpClientTesting(), provideRouter([]),
      ],
    });
    active = TestBed.inject(ActiveProjectService);
    active.setActiveProject(project, 'owner');
    fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  }

  function body(content: ExpenseResponse[], overrides: Partial<ExpensePageResponse> = {}): ExpensePageResponse {
    return { content, page: 0, size: 15, totalElements: content.length,
      totalPages: content.length ? 1 : 0, totals: zeroTotals, referenceDate: '2026-11-04', ...overrides };
  }

  function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  }

  function click(id: string): void {
    expect(el(id)).withContext(id).not.toBeNull();
    el(id)?.click(); fixture.detectChanges();
  }

  function setDate(value: string): void {
    const input = el<HTMLInputElement>('payment-date');
    expect(input).not.toBeNull();
    if (!input) return;
    input.value = value; input.dispatchEvent(new Event('input')); input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function markButton(scope: 'table' | 'cards'): HTMLButtonElement {
    const root = scope === 'table'
      ? fixture.nativeElement.querySelector('table')
      : fixture.nativeElement.querySelector('[data-testid="expense-cards"]');
    const button = root?.querySelector('[data-testid="mark-expense-paid"]') as HTMLButtonElement | null;
    expect(button).withContext(scope).not.toBeNull();
    return button as HTMLButtonElement;
  }

  function openAndConfirm(): void {
    markButton('table').click(); fixture.detectChanges();
    click('confirm-payment');
  }

  async function openFilters(): Promise<void> {
    const details = el<HTMLDetailsElement>('filters-panel')!;
    const toggled = new Promise<void>(resolve =>
      details.addEventListener('toggle', () => resolve(), { once: true }));
    (details.querySelector('summary') as HTMLElement).click();
    await toggled;
    fixture.detectChanges();
  }

  async function chooseCategoryAndSupplier(): Promise<void> {
    await openFilters();
    http.expectOne(r => r.url.endsWith('/api/expense-categories'))
      .flush([{ id: 'service', name: 'Serviço' }]);
    http.expectOne(r => r.url.endsWith('/api/suppliers'))
      .flush([{ id: 'electrician', name: 'Eletricista', document: null }]);
    fixture.detectChanges();
    const categories = el<HTMLSelectElement>('filter-categoryIds')!;
    categories.options[0].selected = true;
    categories.dispatchEvent(new Event('change', { bubbles: true }));
    const supplier = el<HTMLSelectElement>('filter-supplierId')!;
    supplier.value = 'electrician';
    supplier.dispatchEvent(new Event('change', { bubbles: true }));
  }

  it('offers the action only for pending expenses and opens the shared modal from desktop and mobile rows', () => {
    setup();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '0' && r.params.get('tab') === 'ALL')
      .flush(body([{ ...paidExpense, id: 'expense-1', paidAt: '2026-01-01T00:00:00Z' }, pendingExpense]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('table [data-testid="mark-expense-paid"]').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="expense-cards"] [data-testid="mark-expense-paid"]').length).toBe(1);
    expect(markButton('table').disabled).toBeFalse();
    expect(markButton('cards').disabled).toBeFalse();

    markButton('table').click(); fixture.detectChanges();
    expect(el('payment-modal')).not.toBeNull();
    expect(el('payment-modal')?.textContent).toContain('Instalação elétrica');
    expect(el('payment-modal')?.textContent).toContain('2.345,67');
    expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-04');
    expect(el<HTMLInputElement>('payment-date')?.min).toBe('2026-10-21');
    click('cancel-payment');
    expect(el('payment-modal')).toBeNull();

    markButton('cards').click(); fixture.detectChanges();
    expect(el('payment-modal')).not.toBeNull();
    expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-04');
    http.expectNone(paymentUrl);
    http.verify();
  });

  it('loads filter catalogs lazily when the visible filter panel is opened', async () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();
    http.expectNone(r => r.url.endsWith('/api/expense-categories'));
    http.expectNone(r => r.url.endsWith('/api/suppliers'));

    await openFilters();
    http.expectOne(r => r.url.endsWith('/api/expense-categories'))
      .flush([{ id: 'service', name: 'Serviço' }]);
    http.expectOne(r => r.url.endsWith('/api/suppliers'))
      .flush([{ id: 'electrician', name: 'Eletricista', document: null }]);
    fixture.detectChanges();

    expect(el<HTMLSelectElement>('filter-categoryIds')?.options.length).toBe(1);
    expect(el<HTMLSelectElement>('filter-supplierId')?.options.length).toBe(2);
    http.verify();
  });

  it('applies visible date, category and supplier filters to the list request', async () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();
    await chooseCategoryAndSupplier();
    const purchaseDateFrom = el<HTMLInputElement>('filter-purchaseDateFrom')!;
    purchaseDateFrom.value = '2026-10-01';
    purchaseDateFrom.dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('[data-testid="expense-filters"] button[type="submit"]') as HTMLButtonElement).click();
    const request = http.expectOne(r => r.url === listUrl && r.params.get('purchaseDateFrom') === '2026-10-01');
    expect(request.request.params.getAll('categoryIds')).toEqual(['service']);
    expect(request.request.params.get('supplierId')).toBe('electrician');
    request.flush(body([pendingExpense]));
    fixture.detectChanges();
    http.verify();
  });

  it('changes sort from the visible control while retaining the applied filters', async () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();
    await chooseCategoryAndSupplier();
    const purchaseDateFrom = el<HTMLInputElement>('filter-purchaseDateFrom')!;
    purchaseDateFrom.value = '2026-10-01';
    purchaseDateFrom.dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('[data-testid="expense-filters"] button[type="submit"]') as HTMLButtonElement).click();
    const filtered = http.expectOne(r => r.url === listUrl && r.params.get('purchaseDateFrom') === '2026-10-01');
    expect(filtered.request.params.getAll('categoryIds')).toEqual(['service']);
    expect(filtered.request.params.get('supplierId')).toBe('electrician');
    filtered.flush(body([pendingExpense]));
    fixture.detectChanges();

    const sort = el<HTMLSelectElement>('expense-sort')!;
    sort.value = 'AMOUNT_DESC';
    sort.dispatchEvent(new Event('change', { bubbles: true }));
    const sorted = http.expectOne(r => r.url === listUrl && r.params.get('sort') === 'AMOUNT_DESC');
    expect(sorted.request.params.get('purchaseDateFrom')).toBe('2026-10-01');
    expect(sorted.request.params.getAll('categoryIds')).toEqual(['service']);
    expect(sorted.request.params.get('supplierId')).toBe('electrician');
    sorted.flush(body([pendingExpense]));
    fixture.detectChanges();
    http.verify();

  });

  it('confirms through the dedicated API and reloads preserving tab, filters and sort', async () => {
    setup();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '0' && r.params.get('tab') === 'ALL')
      .flush(body([pendingExpense]));
    fixture.detectChanges();
    (el<HTMLButtonElement>('expense-tab-PENDING')!).click(); fixture.detectChanges();
    http.expectOne(r => r.url === listUrl && r.params.get('tab') === 'PENDING')
      .flush(body([pendingExpense]));
    fixture.detectChanges();
    await chooseCategoryAndSupplier();
    const purchaseDateFrom = el<HTMLInputElement>('filter-purchaseDateFrom')!;
    purchaseDateFrom.value = '2026-10-01';
    purchaseDateFrom.dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('[data-testid="expense-filters"] button[type="submit"]') as HTMLButtonElement).click();
    const filtered = http.expectOne(r => r.url === listUrl && r.params.get('purchaseDateFrom') === '2026-10-01');
    expect(filtered.request.params.getAll('categoryIds')).toEqual(['service']);
    expect(filtered.request.params.get('supplierId')).toBe('electrician');
    filtered.flush(body([pendingExpense]));
    fixture.detectChanges();
    const sort = el<HTMLSelectElement>('expense-sort')!;
    sort.value = 'AMOUNT_DESC';
    sort.dispatchEvent(new Event('change', { bubbles: true }));
    http.expectOne(r => r.url === listUrl && r.params.get('sort') === 'AMOUNT_DESC')
      .flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    const payment = http.expectOne(paymentUrl);
    expect(payment.request.method).toBe('PUT');
    expect(payment.request.body).toEqual({ paymentDate: '2026-11-04' });
    payment.flush(paidExpense);
    fixture.detectChanges();

    expect(el('payment-modal')).toBeNull();
    expect(el('payment-settled-notice')?.textContent).toContain('Pagamento confirmado');
    const reload = http.expectOne(r => r.url === listUrl && r.params.get('page') === '0'
      && r.params.get('tab') === 'PENDING' && r.params.get('sort') === 'AMOUNT_DESC'
      && r.params.get('purchaseDateFrom') === '2026-10-01');
    expect(reload.request.params.getAll('categoryIds')).toEqual(['service']);
    expect(reload.request.params.get('supplierId')).toBe('electrician');
    reload.flush(body([], { totals: { totalPaid: 2345.67, totalPending: 0, totalGeneral: 2345.67 } }));
    fixture.detectChanges();

    expect(el('expense-tab-PENDING')?.getAttribute('aria-selected')).toBe('true');
    expect(el<HTMLSelectElement>('expense-sort')?.value).toBe('AMOUNT_DESC');
    expect(el('total-paid')?.textContent).toContain('2.345,67');
    expect(el('total-pending')?.textContent).toContain('0,00');
    expect(el('total-general')?.textContent).toContain('2.345,67');
    expect(el('expenses-loading')).toBeNull();
    http.expectNone(paymentUrl);
    http.verify();
  });

  it('clears the previous settlement notice when opening another payment after a successful refresh', () => {
    setup();
    const anotherPending: ExpenseResponse = {
      ...pendingExpense, id: 'expense-3', description: 'Outra conta',
    };
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense, anotherPending]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    http.expectOne(r => r.url === listUrl).flush(body([paidExpense, anotherPending]));
    fixture.detectChanges();
    expect(el('payment-settled-notice')?.textContent).toContain('Instalação elétrica');

    const anotherRow = fixture.nativeElement.querySelector('table tbody tr:last-child') as HTMLTableRowElement | null;
    expect(anotherRow?.textContent).toContain('Outra conta');
    const anotherPaymentButton = anotherRow?.querySelector('[data-testid="mark-expense-paid"]') as HTMLButtonElement | null;
    expect(anotherPaymentButton).not.toBeNull();
    anotherPaymentButton?.click(); fixture.detectChanges();

    expect(el('payment-modal')).not.toBeNull();
    expect(el('payment-settled-notice')).toBeNull();
    http.expectNone(paymentUrl);
    http.verify();
  });

  it('adjusts to an existing page when the last row leaves the current page', () => {
    setup();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '0')
      .flush(body([pendingExpense], { totalPages: 2, totalElements: 16 }));
    fixture.detectChanges();
    const nextPage = el('pagination')!.querySelector<HTMLButtonElement>('button:last-child')!;
    expect(nextPage.disabled).toBeFalse();
    nextPage.click(); fixture.detectChanges();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '1')
      .flush(body([pendingExpense], { page: 1, totalPages: 2, totalElements: 16 }));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '1')
      .flush(body([], { page: 1, totalPages: 1, totalElements: 0 }));
    const adjusted = http.expectOne(r => r.url === listUrl && r.params.get('page') === '0'
      && r.params.get('tab') === 'ALL' && r.params.get('sort') === 'PURCHASE_DATE_DESC');
    adjusted.flush(body([paidExpense], { totalElements: 1 }));
    fixture.detectChanges();

    expect(el('pagination')?.textContent).toContain('Página 1 de 1');
    expect(el('pagination')?.textContent).toContain('1 registro no resultado');
    const rows = fixture.nativeElement.querySelectorAll('table tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain(paidExpense.description);
    expect(rows[0].querySelector('.account-status')?.textContent).toBe('Pago');
    http.expectNone(listUrl);
    http.verify();
  });

  it('shows the settled civil date and reports a failed refresh offering a new query', () => {
    setup();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '0').flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    const notice = el('payment-settled-notice');
    expect(notice?.textContent).toContain('06/11/2026');
    expect(notice?.textContent).not.toContain('05/11/2026');
    http.expectOne(r => r.url === listUrl)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(el('payment-settled-notice')?.textContent).toContain('Pagamento confirmado');
    expect(el('expenses-loading')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('A quitação ocorreu, mas a atualização da consulta falhou');
    const retry = el<HTMLButtonElement>('retry-expenses');
    expect(retry?.textContent).toContain('Consultar novamente');
    retry?.click(); fixture.detectChanges();
    http.expectOne(r => r.url === listUrl).flush(body([paidExpense]));
    fixture.detectChanges();

    expect(el('retry-expenses')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('A quitação ocorreu, mas a atualização da consulta falhou');
    expect(el('payment-settled-notice')).not.toBeNull();
    http.expectNone(paymentUrl);
    http.verify();
  });

  it('adjusts to an existing page when the retry after a failed settlement reload returns an empty page', () => {
    setup();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '0')
      .flush(body([pendingExpense], { totalPages: 2, totalElements: 16 }));
    fixture.detectChanges();
    const nextPage = el('pagination')!.querySelector<HTMLButtonElement>('button:last-child')!;
    expect(nextPage.disabled).toBeFalse();
    nextPage.click(); fixture.detectChanges();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '1')
      .flush(body([pendingExpense], { page: 1, totalPages: 2, totalElements: 16 }));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '1')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(el<HTMLButtonElement>('retry-expenses')?.textContent).toContain('Consultar novamente');
    click('retry-expenses');
    http.expectOne(r => r.url === listUrl && r.params.get('page') === '1')
      .flush(body([], { page: 1, totalPages: 1, totalElements: 0 }));
    const adjusted = http.expectOne(r => r.url === listUrl && r.params.get('page') === '0');
    adjusted.flush(body([paidExpense], { totalElements: 1 }));
    fixture.detectChanges();

    expect(el('pagination')?.textContent).toContain('Página 1 de 1');
    expect(el('pagination')?.textContent).toContain('1 registro no resultado');
    const rows = fixture.nativeElement.querySelectorAll('table tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain(paidExpense.description);
    expect(rows[0].querySelector('.account-status')?.textContent).toBe('Pago');
    expect(el('retry-expenses')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('A quitação ocorreu, mas a atualização da consulta falhou');
    http.expectNone(listUrl);
    http.verify();
  });

  it('shows the generic query error after a successful settlement reload', () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    http.expectOne(r => r.url === listUrl).flush(body([paidExpense]));
    fixture.detectChanges();

    click('expense-tab-PAID');
    http.expectOne(r => r.url === listUrl && r.params.get('tab') === 'PAID')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar as despesas.');
    expect(fixture.nativeElement.textContent)
      .not.toContain('A quitação ocorreu, mas a atualização da consulta falhou');
    expect(el<HTMLButtonElement>('retry-expenses')?.textContent).toContain('Tentar novamente');
    http.verify();
  });

  it('discards an unsaved date on cancel or Escape and reopens with the suggested date', () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();

    markButton('table').click(); fixture.detectChanges();
    setDate('2026-12-01');
    click('cancel-payment');
    expect(el('payment-modal')).toBeNull();
    http.expectNone(paymentUrl);

    markButton('table').click(); fixture.detectChanges();
    expect(el<HTMLInputElement>('payment-date')?.value).toBe('2026-11-04');
    setDate('2026-12-02');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el('payment-modal')).toBeNull();
    http.expectNone(paymentUrl);
    http.verify();
  });

  it('keeps recovery available when the reconciliation query fails, then settles the paid state', () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(el('payment-recovery')).not.toBeNull();
    expect(el('payment-settled-notice')).toBeNull();

    click('reconcile-payment');
    http.expectOne(expenseUrl).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(el('reconcile-payment')).not.toBeNull();
    expect(el('payment-settled-notice')).toBeNull();

    click('reconcile-payment');
    http.expectOne(expenseUrl).flush(paidExpense);
    fixture.detectChanges();
    expect(el('payment-modal')).toBeNull();
    expect(el('payment-settled-notice')?.textContent).toContain('06/11/2026');
    http.expectOne(r => r.url === listUrl).flush(body([paidExpense]));
    fixture.detectChanges();
    http.expectNone(paymentUrl);
    http.verify();
  });

  it('releases a manual retry only after reconciliation confirms the expense is still pending', () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    click('reconcile-payment');
    http.expectOne(expenseUrl).flush({ ...pendingExpense, paid: false, paidAt: null });
    fixture.detectChanges();

    expect(el<HTMLButtonElement>('confirm-payment')?.disabled).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('pendente');
    http.expectNone(paymentUrl);

    click('confirm-payment');
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    expect(el('payment-modal')).toBeNull();
    http.expectOne(r => r.url === listUrl).flush(body([paidExpense]));
    http.verify();
  });

  it('does not query or offer settlement without an active project', () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AccountsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    active = TestBed.inject(ActiveProjectService);
    active.clear();
    fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);

    http.expectNone(listUrl);
    expect(fixture.nativeElement.querySelector('[data-testid="mark-expense-paid"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Selecione uma obra');
    http.verify();
  });

  it('invalidates the modal and ignores an in-flight settlement after an A → B → A switch', () => {
    setup();
    http.expectOne(r => r.url === listUrl && r.params.get('projectId') === 'project').flush(body([pendingExpense]));
    fixture.detectChanges();

    markButton('table').click(); fixture.detectChanges();
    click('confirm-payment');
    const payment = http.expectOne(paymentUrl);

    const other: Project = { ...project, id: 'project-b', name: 'Outra obra' };
    active.setActiveProject(other, 'owner');
    fixture.detectChanges();
    expect(el('payment-modal')).toBeNull();
    http.expectOne(r => r.url === listUrl && r.params.get('projectId') === 'project-b')
      .flush(body([], { totals: zeroTotals }));
    fixture.detectChanges();

    expect(payment.cancelled).toBeTrue();
    fixture.detectChanges();
    expect(el('payment-settled-notice')).toBeNull();
    http.expectNone(r => r.url === listUrl);

    active.setActiveProject(project, 'owner');
    fixture.detectChanges();
    expect(el('payment-modal')).toBeNull();
    http.expectOne(r => r.url === listUrl && r.params.get('projectId') === 'project').flush(body([pendingExpense]));
    fixture.detectChanges();
    expect(fixture.componentInstance.expenses()).toEqual([pendingExpense]);
    http.verify();
  });

  it('keeps the current tab when a superseded post-settlement reload arrives last', () => {
    setup();
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush(paidExpense);
    fixture.detectChanges();
    const stale = http.expectOne(r => r.url === listUrl && r.params.get('tab') === 'ALL');
    fixture.componentInstance.selectTab('PAID');
    const current = http.expectOne(r => r.url === listUrl && r.params.get('tab') === 'PAID');
    current.flush(body([paidExpense], { totals: { totalPaid: 2345.67, totalPending: 0, totalGeneral: 2345.67 } }));
    fixture.detectChanges();
    stale.flush(body([pendingExpense]));
    fixture.detectChanges();

    expect(fixture.componentInstance.tab()).toBe('PAID');
    expect(fixture.componentInstance.expenses()).toEqual([paidExpense]);
    expect(fixture.nativeElement.querySelector('[data-testid="expense-tab-PAID"]')?.getAttribute('aria-selected')).toBe('true');
    http.verify();
  });

  it('does not announce settlement when the session expires during the payment request', () => {
    setup(true);
    const auth = TestBed.inject(Auth);
    spyOn(auth, 'logout');
    http.expectOne(r => r.url === listUrl).flush(body([pendingExpense]));
    fixture.detectChanges();

    openAndConfirm();
    http.expectOne(paymentUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(auth.logout).toHaveBeenCalled();
    expect(el('payment-settled-notice')).toBeNull();
    expect(el('payment-modal')).not.toBeNull();
    http.expectNone(r => r.url === listUrl);
    http.expectNone(paymentUrl);
    http.verify();
  });
});
