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
  paid: false, dueDate: '2030-01-02', paidAt: null, quantity: null, unitPrice: null,
  totalPrice: 1234.56, receiptState: 'UPLOADED'
};

describe('Expense receipt removal', () => {
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  const endpoint = `${api}/expenses/expense/receipt`;
  const el = (id: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  function clickRemove() {
    expect(el('remove-receipt')).not.toBeNull();
    el('remove-receipt')?.click(); fixture.detectChanges();
  }
  function selectProject(id: string) {
    TestBed.inject(ActiveProjectService).selectProject(
      { id, name: 'Casa', type: 'RENOVATION', status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
  }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'expense']]) } } }] });
    selectProject('project');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseDetailComponent); fixture.detectChanges();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
  });
  afterEach(() => { http.verify(); TestBed.inject(ActiveProjectService).clear(); });

  it('sends a single DELETE while busy and shows no receipt only after confirmed success', () => {
    clickRemove();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('DELETE');
    expect((el('remove-receipt') as HTMLButtonElement)?.disabled).toBeTrue();
    expect(el('no-receipt')).toBeNull();
    clickRemove(); http.expectNone(endpoint);
    request.flush({ ...saved, receiptState: 'NONE' }); fixture.detectChanges();
    expect(el('no-receipt')?.textContent).toContain('Sem comprovante');
    expect(el('download-receipt')).toBeNull(); expect(el('remove-receipt')).toBeNull();
    expect(fixture.componentInstance.expense()).toEqual({ ...saved, receiptState: 'NONE' });
    expect(fixture.nativeElement.textContent).toContain('Cimento');
    expect(fixture.nativeElement.textContent).toContain('Pendente');
    expect(fixture.nativeElement.textContent).toContain('02/01/2030');
    expect(fixture.nativeElement.textContent).toContain('1.234,56');
  });

  it('keeps the attachment and financial data on error and permits a manual retry', () => {
    clickRemove();
    http.expectOne(endpoint).flush({}, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    expect(el('no-receipt')).toBeNull(); expect(el('download-receipt')).not.toBeNull();
    expect(fixture.componentInstance.expense()).toEqual(saved);
    expect(fixture.componentInstance.errorMessage()).toContain('não foi confirmada');
    expect(fixture.componentInstance.errorMessage()).toContain('tentar novamente');
    expect((el('remove-receipt') as HTMLButtonElement)?.disabled).toBeFalse();
    http.expectNone(endpoint);
    clickRemove();
    http.expectOne(endpoint).flush({ ...saved, receiptState: 'NONE' }); fixture.detectChanges();
    expect(el('no-receipt')).not.toBeNull(); expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  it('ignores late success after switching A to B to A', () => {
    clickRemove(); const request = http.expectOne(endpoint);
    selectProject('other'); selectProject('project'); fixture.detectChanges();
    request.flush({ ...saved, receiptState: 'NONE' }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull(); expect(el('no-receipt')).toBeNull();
    expect(fixture.componentInstance.errorMessage()).toContain('A obra foi alterada');
  });
});
