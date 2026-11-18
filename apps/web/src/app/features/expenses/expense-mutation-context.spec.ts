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
  paid: false, dueDate: '2030-01-02', quantity: null, unitPrice: null, totalPrice: 100, receiptState: 'UPLOADED'
};

describe('Expense mutation context', () => {
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  let http: HttpTestingController;
  let projects: ActiveProjectService;
  const api = `${environment.apiUrl}/api`;
  const endpoint = `${api}/expenses/expense`;
  const el = (id: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  function click(id: string) { expect(el(id)).withContext(id).not.toBeNull(); el(id)?.click(); fixture.detectChanges(); }
  function selectProject(id = 'project', name = 'Casa') {
    projects.selectProject({ id, name, type: 'RENOVATION', status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
  }
  function load() {
    fixture = TestBed.createComponent(ExpenseDetailComponent); fixture.detectChanges();
    http.expectOne(endpoint).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
  }
  function edit() {
    click('edit-expense'); http.expectOne(`${api}/expense-categories`).flush([{ id: 'category', name: 'Alvenaria' }]);
    fixture.detectChanges();
    const description = el('edit-description') as HTMLInputElement;
    description.value = 'Rascunho'; description.dispatchEvent(new Event('input')); fixture.detectChanges();
  }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'expense']]) } } }] });
    projects = TestBed.inject(ActiveProjectService); projects.clear(); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); projects.clear(); });

  it('guides project selection without loading or mutating when no project is active', () => {
    fixture = TestBed.createComponent(ExpenseDetailComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Selecione ou cadastre uma obra');
    fixture.componentInstance.openEdit(); fixture.componentInstance.openDelete(); fixture.componentInstance.confirmDelete();
    fixture.componentInstance.removeReceipt(); fixture.componentInstance.uploadReceipt();
    expect(el('expense-edit-modal')).toBeNull(); expect(el('confirm-modal-content')).toBeNull();
    http.expectNone(() => true);
  });

  it('preserves the open draft and accepts its response when only project metadata changes', () => {
    selectProject(); load(); edit(); const version = projects.contextVersion();
    selectProject('project', 'Casa corrigida'); fixture.detectChanges();
    expect(projects.contextVersion()).toBe(version);
    expect((el('edit-description') as HTMLInputElement).value).toBe('Rascunho');
    click('edit-save'); http.expectOne(endpoint).flush({ ...saved, description: 'Rascunho' });
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()?.description).toBe('Rascunho');
  });

  for (const modal of ['edit', 'delete']) {
    it(`abandons an unsent ${modal} when the project changes without any mutation`, () => {
      selectProject(); load();
      if (modal === 'edit') edit(); else click('delete-expense');
      selectProject('other'); fixture.detectChanges();
      expect(el('expense-edit-modal')).toBeNull(); expect(el('confirm-modal-content')).toBeNull();
      expect(fixture.componentInstance.expense()).toBeNull(); http.expectNone(() => true);
    });
  }

  for (const destination of ['other', 'none', 'back']) {
    for (const outcome of ['success', 'error']) {
      it(`ignores late edit ${outcome} after switching to ${destination}`, () => {
        selectProject(); load(); edit(); click('edit-save'); const request = http.expectOne(endpoint);
        if (destination === 'none') projects.clear();
        else { selectProject('other'); if (destination === 'back') selectProject(); }
        // Deliver before change detection destroys the modal: the callback itself must guard the version.
        if (outcome === 'success') request.flush({ ...saved, description: 'Late update' });
        else request.flush({}, { status: 500, statusText: 'Error' });
        fixture.detectChanges();
        expect(fixture.componentInstance.expense()).toBeNull(); expect(el('expense-edit-modal')).toBeNull();
        expect(fixture.nativeElement.textContent).not.toContain('Late update');
        expect(fixture.nativeElement.textContent).not.toContain('Não foi possível confirmar o salvamento');
        expect(fixture.nativeElement.textContent).toContain(destination === 'none' ? 'Selecione ou cadastre' : 'A obra foi alterada');
        http.expectNone(() => true);
      });
    }
  }

  for (const operation of ['delete', 'remove', 'replace']) {
    it(`ignores a late ${operation} error after A to B to A`, () => {
      selectProject(); load();
      if (operation === 'delete') { click('delete-expense'); click('confirm-confirmation'); }
      else if (operation === 'remove') click('remove-receipt');
      else {
        const files = new DataTransfer(); files.items.add(new File(['new'], 'new.pdf', { type: 'application/pdf' }));
        const input = el('receipt-file') as HTMLInputElement; input.files = files.files;
        input.dispatchEvent(new Event('change')); fixture.detectChanges(); click('upload-receipt');
      }
      const request = http.expectOne(operation === 'delete' ? endpoint : `${endpoint}/receipt`);
      selectProject('other'); selectProject();
      request.flush({}, { status: 500, statusText: 'Error' }); fixture.detectChanges();
      expect(fixture.componentInstance.expense()).toBeNull();
      expect(fixture.componentInstance.errorMessage()).toContain('A obra foi alterada');
      expect(fixture.componentInstance.deletionUncertain()).toBeFalse();
      expect(fixture.componentInstance.receiptWarning()).toBe(''); http.expectNone(() => true);
    });
  }
});
