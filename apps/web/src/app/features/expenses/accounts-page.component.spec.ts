import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
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
              expect(markPaid.disabled).toBeTrue();
              expect(markPaid.classList.contains('btn-oc-outline')).toBeTrue();
              visible(markPaid);
              assertCompactAction(markPaid);
              const router = TestBed.inject(Router);
              const previousUrl = router.url;
              markPaid.click();
              fixture.detectChanges();
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
