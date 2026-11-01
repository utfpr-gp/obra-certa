import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { authGuard } from '../../core/guards/auth-guard';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { AccountsPageComponent } from './accounts-page.component';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

describe('Accounts return navigation (CA10)', () => {
  beforeAll(() => registerLocaleData(localePt));
  let http: HttpTestingController;
  const expense = { id: 'expense', projectId: 'project', description: 'Antes',
    purchaseDate: '2026-01-01', categoryId: 'category', categoryName: 'Material',
    supplier: { id: 'supplier', name: 'Loja', document: null }, totalPrice: 40,
    paid: false, dueDate: '2026-02-01', receiptState: 'NONE', quantity: null, unitPrice: null };
  const page = (content: object[], totalPaid = 0, totalPending = 40) => ({ content, page: 0,
    size: 15, totalElements: content.length, totalPages: 1,
    totals: { totalPaid, totalPending, totalGeneral: totalPaid + totalPending } });
  const listRequest = () => http.expectOne(r => r.url.endsWith('/api/expenses'));
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      provideRouter(routes.find(route => route.canActivate?.includes(authGuard))!.children!)] });
    TestBed.inject(ActiveProjectService).selectProject({ id: 'project', name: 'Casa', type: 'RENOVATION',
      status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  for (const change of ['inclusion', 'editing', 'payment', 'deletion'] as const) {
    it(`requests fresh records and totals when returning after confirmed ${change}`, async () => {
      const harness = await RouterTestingHarness.create('/contas');
      listRequest().flush(page([expense])); harness.detectChanges();
      const component = harness.routeDebugElement!.componentInstance as AccountsPageComponent;
      component.selectTab('PENDING'); listRequest().flush(page([expense])); harness.detectChanges();
      if (change === 'inclusion') {
        (harness.routeNativeElement!.querySelector('[data-testid="create-account"]') as HTMLAnchorElement).click();
        await harness.fixture.whenStable();
        http.expectOne(r => r.url.endsWith('/api/expense-categories')).flush([]);
        http.expectOne(r => r.url.endsWith('/api/suppliers')).flush([]);
        http.expectOne(r => r.url.endsWith('/api/budgets')).flush({ categories: [] });
        // The completed operation is represented by the next server response, not a cached list.
        await harness.navigateByUrl('/contas');
      } else {
        (harness.routeNativeElement!.querySelector('a[href="/despesas/expense"]') as HTMLAnchorElement).click();
        await harness.fixture.whenStable();
        http.expectOne(r => r.url.endsWith('/api/expenses/expense')).flush(expense);
        http.expectOne(r => r.url.endsWith('/api/budgets')).flush({ categories: [] });
        harness.detectChanges();
        (harness.routeNativeElement!.querySelector('[data-testid="back-to-accounts"]') as HTMLAnchorElement).click();
        await harness.fixture.whenStable();
      }
      expect(TestBed.inject(Router).url).toBe('/contas');
      expect(harness.routeDebugElement!.componentInstance).toEqual(jasmine.any(AccountsPageComponent));
      expect(harness.routeDebugElement!.componentInstance).not.toBe(component);
      harness.detectChanges();
      const request = listRequest();
      expect(request.request.params.get('tab')).toBe('ALL');
      expect(request.request.params.get('page')).toBe('0');
      const updated = change === 'deletion' ? [] : [
        { ...expense, description: change === 'editing' ? 'Editada' : 'Antes', paid: change === 'payment' },
        ...(change === 'inclusion' ? [{ ...expense, id: 'new', description: 'Incluída' }] : []),
      ];
      request.flush(page(updated, change === 'payment' ? 40 : 0,
        change === 'deletion' || change === 'payment' ? 0 : change === 'inclusion' ? 80 : 40));
      harness.detectChanges();
      const returned = harness.routeDebugElement!.componentInstance as AccountsPageComponent;
      expect(returned).not.toBe(component);
      expect(returned.expenses().map(item => item.id)).toEqual(updated.map(item => item.id));
      expect(returned.totals()?.totalGeneral).toBe(change === 'deletion' ? 0 : change === 'inclusion' ? 80 : 40);
      if (change === 'editing') expect(harness.routeNativeElement!.textContent).toContain('Editada');
      if (change === 'payment') expect(returned.expenses()[0].paid).toBeTrue();
      if (change === 'inclusion') expect(harness.routeNativeElement!.textContent).toContain('Incluída');
      http.expectNone(r => r.method !== 'GET');
    });
  }
});
