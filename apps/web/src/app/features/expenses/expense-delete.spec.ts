import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ExpenseDetailComponent } from './expense-detail.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { environment } from '../../../environments/environment';

const saved: ExpenseResponse = {
  id: 'expense', projectId: 'project', description: 'Cimento', purchaseDate: '2030-01-01',
  categoryId: 'category', categoryName: 'Alvenaria', supplier: { id: 'supplier', name: 'Loja', document: null },
  paid: false, dueDate: '2030-01-02', quantity: null, unitPrice: null, totalPrice: 1234.56, receiptState: 'UPLOADED'
};

describe('Expense deletion', () => {
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  const endpoint = `${api}/expenses/expense`;
  const el = (id: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  function click(id: string) { expect(el(id)).not.toBeNull(); el(id)?.click(); fixture.detectChanges(); }
  function selectProject(id: string) {
    TestBed.inject(ActiveProjectService).selectProject(
      { id, name: 'Casa', type: 'RENOVATION', status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
  }
  function open() { click('delete-expense'); }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'expense']]) } } }] });
    selectProject('project'); http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseDetailComponent); fixture.detectChanges();
    http.expectOne(endpoint).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
  });
  afterEach(() => { http.verify(); TestBed.inject(ActiveProjectService).clear(); });

  it('only sends deletion after confirmation and removes all active expense data on success', () => {
    open(); http.expectNone(endpoint);
    expect(el('confirm-modal-content')?.textContent).toContain('Cimento');
    click('confirm-confirmation');
    const request = http.expectOne(endpoint); expect(request.request.method).toBe('DELETE');
    expect((el('confirm-confirmation') as HTMLButtonElement)?.disabled).toBeTrue();
    click('confirm-confirmation'); http.expectNone(endpoint);
    click('edit-expense'); expect(fixture.componentInstance.editing()).toBeNull();
    fixture.componentInstance.removeReceipt(); fixture.componentInstance.downloadReceipt();
    fixture.componentInstance.uploadReceipt(); http.expectNone(`${endpoint}/receipt`);
    request.flush({ id: 'expense', deleted: true, receiptDeletionFailed: false }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull(); expect(fixture.componentInstance.editing()).toBeNull();
    expect(el('confirm-modal-content')).toBeNull(); expect(el('download-receipt')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Cimento');
    expect(fixture.nativeElement.textContent).toContain('Despesa excluída');
    expect(el('return-to-accounts')?.getAttribute('href')).toBe('/contas');
  });
  for (const method of ['cancel-confirmation', 'close-confirmation', 'escape']) {
    it(`closes via ${method} without sending a request`, () => {
      open();
      if (method === 'escape') { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges(); }
      else click(method);
      expect(el('confirm-modal-content')).toBeNull(); http.expectNone(endpoint);
      expect(fixture.componentInstance.expense()).toEqual(saved);
    });
  }
  it('ignores backdrop clicks', () => {
    open(); click('confirm-modal-backdrop'); expect(el('confirm-modal-content')).not.toBeNull(); http.expectNone(endpoint);
  });
  it('closing during submission never permits a second deletion or other mutation', () => {
    open(); click('confirm-confirmation'); const request = http.expectOne(endpoint);
    click('cancel-confirmation'); expect(el('confirm-modal-content')).toBeNull();
    click('delete-expense'); click('edit-expense');
    http.expectNone(endpoint); expect(fixture.componentInstance.editing()).toBeNull();
    request.flush({ id: 'expense', deleted: true, receiptDeletionFailed: false }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull(); expect(fixture.nativeElement.textContent).toContain('Despesa excluída');
  });
  it('reports failed file removal with confirmed financial success and return to accounts', () => {
    open(); click('confirm-confirmation');
    http.expectOne(endpoint).flush({ id: 'expense', deleted: true, receiptDeletionFailed: true }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Despesa excluída, mas não foi possível apagar o comprovante');
    expect(fixture.nativeElement.textContent).not.toMatch(/posterior|automaticamente|agendad/i);
    expect(el('return-to-accounts')?.textContent).toContain('Contas a Pagar'); http.expectNone(endpoint);
  });
  it('does not announce success or automatically retry when the result is uncertain', () => {
    open(); click('confirm-confirmation');
    http.expectOne(endpoint).error(new ProgressEvent('error')); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toEqual(saved);
    expect(fixture.componentInstance.errorMessage()).toContain('não foi confirmada');
    expect(fixture.componentInstance.errorMessage()).toContain('Consulte o estado atual');
    expect(el('check-delete-state')).not.toBeNull(); http.expectNone(endpoint);
    click('check-delete-state'); http.expectOne(endpoint).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
  });
  it('ignores late deletion success after switching A to B to A', () => {
    open(); click('confirm-confirmation'); const request = http.expectOne(endpoint);
    selectProject('other'); selectProject('project'); fixture.detectChanges();
    request.flush({ id: 'expense', deleted: true, receiptDeletionFailed: true }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull(); expect(el('return-to-accounts')).toBeNull();
    expect(fixture.componentInstance.errorMessage()).toContain('A obra foi alterada');
  });

  it('removes stale active data when checking a lost deletion response returns 404 without claiming deletion', () => {
    open(); click('confirm-confirmation');
    http.expectOne(endpoint).error(new ProgressEvent('error')); fixture.detectChanges();
    http.expectNone(request => request.method === 'DELETE');
    click('check-delete-state');
    http.expectOne(endpoint).flush({}, { status: 404, statusText: 'Not Found' }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull();
    for (const id of ['edit-expense', 'delete-expense', 'download-receipt', 'remove-receipt']) expect(el(id)).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Cimento');
    expect(fixture.nativeElement.textContent).toContain('indisponível');
    expect(fixture.componentInstance.deletionMessage()).toBe('');
    http.expectNone(request => request.method !== 'GET');
  });

  it('does not resurrect an expense from an older state check after confirmed deletion in the same project', () => {
    fixture.componentInstance.checkCurrentState();
    const oldRead = http.expectOne(endpoint);
    open(); click('confirm-confirmation');
    http.expectOne(endpoint).flush({ id: 'expense', deleted: true, receiptDeletionFailed: false }); fixture.detectChanges();
    oldRead.flush(saved); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull();
    expect(el('edit-expense')).toBeNull(); expect(el('delete-expense')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Despesa excluída');
    http.expectNone(`${api}/budgets?projectId=project`);
  });
});
