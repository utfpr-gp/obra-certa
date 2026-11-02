import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccountsPageComponent } from './accounts-page.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { Auth } from '../../core/services/auth';
import { Project } from '../../core/models/project.model';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

describe('Accounts query context (CA9 and CA10)', () => {
  beforeAll(() => registerLocaleData(localePt));
  let fixture: ComponentFixture<AccountsPageComponent>;
  let http: HttpTestingController;
  let active: ActiveProjectService;
  const project = (id: string): Project => ({ id, name: id, type: 'RENOVATION',
    status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' });
  const response = (description: string, page = 0) => ({ content: [{ id: description,
    projectId: 'A', description, categoryName: 'Material', supplier: { name: 'Loja' },
    purchaseDate: '2026-01-01', totalPrice: 20, paid: true }], page, size: 15,
    totalPages: 4, totalElements: 60, totals: { totalPaid: 20, totalPending: 0, totalGeneral: 20 } });
  const request = () => http.expectOne(r => r.url.endsWith('/api/expenses'));
  const select = (id: string) => { active.selectProject(project(id), 'owner'); fixture.detectChanges(); };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [AccountsPageComponent], providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
    ] });
    http = TestBed.inject(HttpTestingController);
    active = TestBed.inject(ActiveProjectService);
    active.selectProject(project('A'), 'owner');
    fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  for (const failure of [false, true]) {
    it(`ignores old ${failure ? 'errors' : 'successes'} after A → B → A`, () => {
      const old = request();
      select('B'); const middle = request();
      select('A'); request().flush(response('Atual'));
      middle.flush(response('Obra B'));
      if (failure) old.flush({}, { status: 503, statusText: 'Unavailable' });
      else old.flush(response('Antiga'));
      expect(fixture.componentInstance.expenses()[0]?.description).toBe('Atual');
      expect(fixture.componentInstance.error()).toBeNull();
      expect(fixture.componentInstance.loading()).toBeFalse();
    });
  }

  it('protects even A → B → A transitions between Angular effects', () => {
    const old = request();
    active.selectProject(project('B'), 'owner');
    active.selectProject(project('A'), 'owner');
    old.flush(response('Antiga'));
    expect(fixture.componentInstance.expenses()).toEqual([]);
    fixture.detectChanges(); request().flush(response('Atual'));
  });

  for (const failure of [false, true]) {
    it(`ignores previous page ${failure ? 'error' : 'success'} when the newest page finishes first`, () => {
      request().flush(response('Inicial'));
      fixture.componentInstance.loadPage(1); const old = request();
      fixture.componentInstance.loadPage(2); request().flush(response('Página 3', 2));
      if (failure) old.flush({}, { status: 500, statusText: 'Error' });
      else old.flush(response('Página 2', 1));
      expect(fixture.componentInstance.page()).toBe(2);
      expect(fixture.componentInstance.expenses()[0]?.description).toBe('Página 3');
      expect(fixture.componentInstance.error()).toBeNull();
    });
  }

  it('abandons filters, tab, sorting and page on another project, preserving same-project updates', () => {
    request().flush(response('Inicial'));
    const component = fixture.componentInstance;
    component.selectTab('PENDING'); request().flush(response('Pendente'));
    component.filterForm.patchValue({ supplierId: 'supplier', purchaseDateFrom: '2026-01-01' });
    component.applyFilters(); request().flush(response('Filtrada'));
    component.selectSort({ target: { value: 'AMOUNT_ASC' } } as unknown as Event);
    request().flush(response('Ordenada'));
    component.loadPage(2); request().flush(response('Página 3', 2));
    active.selectProject({ ...project('A'), name: 'Nome atualizado' }, 'owner'); fixture.detectChanges();
    http.expectNone(r => r.url.endsWith('/api/expenses'));
    expect(component.tab()).toBe('PENDING'); expect(component.page()).toBe(2);
    expect(component.filters().supplierId).toBe('supplier');
    expect(component.sort()).toBe('AMOUNT_ASC');
    select('B');
    const next = request();
    expect(next.request.params.get('tab')).toBe('ALL');
    expect(next.request.params.get('page')).toBe('0');
    expect(next.request.params.get('sort')).toBe('PURCHASE_DATE_DESC');
    expect(next.request.params.has('supplierId')).toBeFalse();
    expect(component.filterForm.getRawValue().supplierId).toBe('');
    expect(component.filters()).toEqual({}); expect(component.expenses()).toEqual([]);
    next.flush(response('B'));
  });

  for (const failure of [false, true]) {
    it(`keeps the newest query loading after an outdated ${failure ? 'error' : 'success'}`, () => {
      const old = request(); fixture.componentInstance.loadPage(1); const current = request();
      if (failure) old.flush({}, { status: 503, statusText: 'Unavailable' });
      else old.flush(response('Antiga'));
      expect(fixture.componentInstance.loading()).toBeTrue();
      expect(fixture.componentInstance.expenses()).toEqual([]);
      expect(fixture.componentInstance.totals()).toBeNull();
      expect(fixture.componentInstance.error()).toBeNull();
      current.flush(response('Atual', 1));
    });
  }

  for (const change of ['tab', 'filter', 'sort'] as const) {
    for (const failure of [false, true]) {
      it(`ignores outdated ${failure ? 'error' : 'success'} after changing ${change}`, () => {
        const old = request(); const component = fixture.componentInstance;
        if (change === 'tab') component.selectTab('PAID');
        if (change === 'filter') {
          component.filterForm.patchValue({ supplierId: 'supplier' }); component.applyFilters();
        }
        if (change === 'sort') component.selectSort({ target: { value: 'AMOUNT_ASC' } } as unknown as Event);
        request().flush(response('Atual'));
        if (failure) old.flush({}, { status: 503, statusText: 'Unavailable' });
        else old.flush(response('Antiga'));
        expect(component.expenses()[0]?.description).toBe('Atual');
        expect(component.error()).toBeNull(); expect(component.loading()).toBeFalse();
      });
    }
  }

  it('clears pending loading and guides selection without querying when the active project disappears', () => {
    const old = request(); active.clear(); fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Selecione uma obra');
    expect(fixture.nativeElement.querySelector('[data-testid="empty-project"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Totalizadores das despesas"]')).toBeNull();
    http.expectNone(r => r.url.endsWith('/api/expenses'));
    old.flush(response('Antiga'));
    expect(fixture.componentInstance.expenses()).toEqual([]);
  });

  for (const network of [false, true]) {
    it(`retries ${network ? 'network' : 'server'} failure manually with the same tab, filters and page`, () => {
      request().flush(response('Inicial'));
      const component = fixture.componentInstance;
      component.selectTab('PENDING'); request().flush(response('Pendente'));
      component.filterForm.patchValue({ supplierId: 'supplier' });
      component.applyFilters(); request().flush(response('Filtrada'));
      component.loadPage(2); const failed = request();
      if (network) failed.error(new ProgressEvent('error'));
      else failed.flush({}, { status: 503, statusText: 'Unavailable' });
      fixture.detectChanges();
      expect(component.expenses()).toEqual([]); expect(component.totals()).toBeNull();
      expect(fixture.nativeElement.textContent).not.toMatch(/R\$/);
      expect(fixture.nativeElement.querySelector('[data-testid="expenses-loading"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[role="tabpanel"]').getAttribute('aria-busy')).toBe('false');
      expect(component.tab()).toBe('PENDING'); expect(component.filters().supplierId).toBe('supplier');
      http.expectNone(r => r.url.endsWith('/api/expenses'));
      const retry = fixture.nativeElement.querySelector('[data-testid="retry-expenses"]') as HTMLButtonElement;
      expect(retry).not.toBeNull();
      if (!retry) return;
      retry.click(); const retried = request();
      expect(retried.request.urlWithParams).toBe(failed.request.urlWithParams);
      retried.flush(response('Recuperada', 2));
      expect(component.expenses()[0].description).toBe('Recuperada');
    });
  }

  it('uses the real 401 interceptor once and does not restore the query after login', () => {
    const auth = TestBed.inject(Auth);
    const logout = spyOn(auth, 'logout').and.callThrough();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    request().flush({}, { status: 401, statusText: 'Unauthorized' }); fixture.detectChanges();
    expect(logout).toHaveBeenCalledTimes(1); expect(active.activeProject()).toBeNull();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(fixture.componentInstance.error()).toBeNull();
    auth.saveToken('new-session'); fixture.detectChanges();
    http.expectNone(r => r.url.endsWith('/api/expenses'));
  });

  it('ignores an outstanding response after leaving the page without financial writes', () => {
    const old = request(); const component = fixture.componentInstance;
    fixture.destroy(); old.flush(response('Depois de sair'));
    expect(component.expenses()).toEqual([]);
    http.expectNone(r => r.method !== 'GET');
  });
});
