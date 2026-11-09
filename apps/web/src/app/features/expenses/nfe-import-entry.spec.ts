import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AccountsPageComponent } from './accounts-page.component';
import { NfeImportDialogComponent } from './nfe-import/nfe-import-dialog.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { Project } from '../../core/models/project.model';

describe('NF-e import entry (CA1 entry point and CA9 on screen)', () => {
  beforeAll(() => registerLocaleData(localePt));
  let fixture: ComponentFixture<AccountsPageComponent>;
  let http: HttpTestingController;
  let active: ActiveProjectService;

  const project = (id: string): Project => ({ id, name: id, type: 'RENOVATION',
    status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' });
  const expenses = { content: [], page: 0, size: 15, totalPages: 1, totalElements: 0,
    totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } };
  const created: ExpenseResponse[] = [
    {
      id: 'expense-1', projectId: 'A', description: 'Cimento CP II', purchaseDate: '2026-07-10',
      categoryId: 'cat-1', categoryName: 'Alvenaria', supplier: { id: 'sup-1', name: 'Fornecedor XPTO', document: '12345678000199' },
      paid: true, dueDate: null, quantity: 2, unitPrice: 25, totalPrice: 50, receiptState: 'UPLOADED',
    },
    {
      id: 'expense-2', projectId: 'A', description: 'Areia média', purchaseDate: '2026-07-10',
      categoryId: 'cat-2', categoryName: 'Elétrica', supplier: { id: 'sup-1', name: 'Fornecedor XPTO', document: '12345678000199' },
      paid: true, dueDate: null, quantity: 1.5, unitPrice: 80, totalPrice: 120, receiptState: 'NONE',
    },
  ];
  const el = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
    fixture.nativeElement.querySelector(`[data-testid="${id}"]`);

  function openDialog(): void {
    el<HTMLButtonElement>('import-nfe')?.click();
    fixture.detectChanges();
  }

  function emitImported(list: ExpenseResponse[]): void {
    const dialog = fixture.debugElement.query(By.directive(NfeImportDialogComponent));
    expect(dialog).withContext('nfe-import-dialog').not.toBeNull();
    dialog.componentInstance.imported.emit(list);
    fixture.detectChanges();
  }

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
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(expenses);
    fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify(); localStorage.clear(); });

  it('opens the NF-e import dialog from the expenses listing', () => {
    const button = el<HTMLButtonElement>('import-nfe');
    expect(button).withContext('import-nfe').not.toBeNull();
    button?.click();
    fixture.detectChanges();

    expect(el('nfe-import-dialog')).not.toBeNull();
  });

  it('closes the import dialog when the active project changes', () => {
    el<HTMLButtonElement>('import-nfe')?.click();
    fixture.detectChanges();
    expect(el('nfe-import-dialog')).not.toBeNull();

    active.selectProject(project('B'), 'owner');
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(expenses);
    fixture.detectChanges();

    expect(el('nfe-import-dialog')).toBeNull();
  });

  it('reloads the listing after an import and keeps the current tab and sort', () => {
    fixture.componentInstance.selectTab('PAID');
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(expenses);
    fixture.detectChanges();

    openDialog();
    emitImported(created);

    expect(el('nfe-import-dialog')).toBeNull();
    expect(el('nfe-import-notice')?.textContent).toContain('2 linhas criadas');

    const reload = http.expectOne(r => r.url.endsWith('/api/expenses'));
    expect(reload.request.params.get('tab')).toBe('PAID');
    expect(reload.request.params.get('sort')).toBe('PURCHASE_DATE_DESC');
    reload.flush({ ...expenses, content: created, totalElements: 2 });
    fixture.detectChanges();

    expect(el('nfe-import-notice')?.textContent).toContain('2 linhas criadas');
  });

  it('keeps the import success notice when the reload fails', () => {
    openDialog();
    emitImported(created);

    expect(el('nfe-import-dialog')).toBeNull();
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('nfe-import-notice')?.textContent).toContain('2 linhas criadas');
    expect(fixture.nativeElement.textContent).toContain('Importou, mas a consulta falhou');
  });

  it('does not reload the listing when the dialog closes without importing', () => {
    openDialog();
    el<HTMLButtonElement>('close-nfe-import')?.click();
    fixture.detectChanges();

    expect(el('nfe-import-dialog')).toBeNull();
    http.expectNone(r => r.url.endsWith('/api/expenses'));
  });
});
