import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AccountsPageComponent } from './accounts-page.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';

describe('AccountsPageComponent', () => {
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
        content: [{ id: 'expense-1', description: 'Cimento', categoryName: 'Material',
          supplier: { name: 'Loja' }, purchaseDate: '2026-01-01', dueDate: null,
          totalPrice: 125.5, paid: true }],
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
    first.flush({ content: [{ id: 'old', description: 'Antiga' }], page: 0, size: 15,
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
