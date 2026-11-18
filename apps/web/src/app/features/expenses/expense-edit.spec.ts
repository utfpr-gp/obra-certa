import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ExpenseDetailComponent } from './expense-detail.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { environment } from '../../../environments/environment';

const saved: ExpenseResponse = {
  id: 'expense',
  projectId: 'project',
  description: 'Cimento',
  purchaseDate: '2030-01-01',
  categoryId: 'category',
  categoryName: 'Alvenaria',
  supplier: { id: 'supplier', name: 'Loja', document: null },
  paid: true,
  dueDate: null,
  quantity: null,
  unitPrice: null,
  totalPrice: 1234.56,
  receiptState: 'NONE',
  paidAt: null
};

describe('Expense editing', () => {
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  const el = (id: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);

  function click(id: string) {
    expect(el(id)).withContext(id).not.toBeNull();
    el(id)?.click();
    fixture.detectChanges();
  }

  function input(id: string, value: string) {
    const node = el(id) as HTMLInputElement;
    expect(node).not.toBeNull();
    if (node) {
      node.value = value;
      node.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }

  function selectOption(id: string, index: number) {
    const node = el(id) as HTMLSelectElement;
    expect(node).not.toBeNull();
    if (node) {
      node.selectedIndex = index;
      node.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }
  }

  function open() {
    click('edit-expense');
    http.expectOne(`${api}/expense-categories`).flush([
      { id: 'category', name: 'Alvenaria' },
      { id: 'other', name: 'Pintura' }
    ]);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'expense']]) } } }
      ]
    });
    TestBed.inject(ActiveProjectService).selectProject(
      { id: 'project', name: 'Casa', type: 'RENOVATION', status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' },
      'owner'
    );
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(ActiveProjectService).clear();
  });

  it('opens prefilled without allowing project changes and sends the original monetary magnitude', () => {
    open();
    expect((el('edit-description') as HTMLInputElement).value).toBe('Cimento');
    expect((el('edit-totalPrice') as HTMLInputElement).value.replace(/\s/g, ' ')).toBe('R$ 1.234,56');
    expect((el('edit-project') as HTMLInputElement).disabled).toBeTrue();
    expect((el('edit-paid') as HTMLSelectElement).selectedIndex).toBe(0); // Quitada
    expect(el('edit-dueDate')).toBeNull();

    input('edit-description', 'Corrigida');
    click('edit-save');

    const request = http.expectOne(`${api}/expenses/expense`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      description: 'Corrigida',
      purchaseDate: '2030-01-01',
      categoryId: 'category',
      valueMode: 'DIRECT',
      totalPrice: 1234.56,
      paid: true
    });
    request.flush({ ...saved, description: 'Corrigida' });
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [{ categoryId: 'category', plannedAmount: 100, state: 'EXCEEDED' }] });
    fixture.detectChanges();

    expect(el('expense-edit-modal')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Corrigida');
    expect(el('budget-ceiling-alert')).not.toBeNull();
  });

  it('requires due date and enforces temporal constraint when switching to pending, presenting the saved result', () => {
    open();
    // Alterna para "Não quitada" (index 1)
    selectOption('edit-paid', 1);
    expect(el('edit-dueDate')).not.toBeNull();

    // Tenta salvar sem vencimento
    click('edit-save');
    http.expectNone(r => r.method === 'PUT');
    expect(el('edit-dueDate-error')).not.toBeNull();
    expect(el('edit-dueDate-error')?.textContent).toContain('Informe o vencimento');

    // Vencimento anterior à data da despesa (2030-01-01)
    input('edit-dueDate', '2029-12-31');
    click('edit-save');
    http.expectNone(r => r.method === 'PUT');
    expect(el('edit-dueDate-error')?.textContent).toContain('não pode ser anterior à data da despesa');

    // Vencimento válido igual ou posterior à data da despesa
    input('edit-dueDate', '2030-01-10');
    click('edit-save');

    const request = http.expectOne(`${api}/expenses/expense`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      paid: false,
      dueDate: '2030-01-10'
    }));

    const pendingSaved = {
      ...saved,
      paid: false,
      dueDate: '2030-01-10'
    };
    request.flush(pendingSaved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] });
    fixture.detectChanges();

    // Apresentação do resultado salvo na consulta:
    expect(el('expense-edit-modal')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Pendente');
    expect(fixture.nativeElement.textContent).toContain('10/01/2030');
  });

  it('switches from pending to paid and presents quitada on saved detail', () => {
    // Atualiza o estado da despesa para pendente
    fixture.componentInstance.expense.set({
      ...saved,
      paid: false,
      dueDate: '2030-01-10'
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pendente');

    open();
    expect((el('edit-paid') as HTMLSelectElement).selectedIndex).toBe(1); // Não quitada
    expect((el('edit-dueDate') as HTMLInputElement).value).toBe('2030-01-10');

    // Alterna para Quitada (index 0)
    selectOption('edit-paid', 0);
    expect(el('edit-dueDate')).toBeNull();

    click('edit-save');

    const request = http.expectOne(`${api}/expenses/expense`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.paid).toBeTrue();
    expect(request.request.body.dueDate).toBeUndefined();

    request.flush({
      ...saved,
      paid: true,
      paidAt: '2030-01-05T10:00:00Z',
      dueDate: '2030-01-10'
    });
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] });
    fixture.detectChanges();

    expect(el('expense-edit-modal')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Quitada');
  });

  it('interprets typed monetary digits as cents and sends reais through the service', () => {
    open();
    input('edit-totalPrice', '123456');
    expect((el('edit-totalPrice') as HTMLInputElement).value.replace(/\s/g, ' ')).toBe('R$ 1.234,56');
    click('edit-save');

    const request = http.expectOne(`${api}/expenses/expense`);
    expect(request.request.body.totalPrice).toBe(1234.56);
    expect(request.request.body.paid).toBeTrue();
    request.flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] });
    fixture.detectChanges();
    expect(el('expense-edit-modal')).toBeNull();
  });

  it('highlights invalid values and does not submit', () => {
    open();
    input('edit-description', '   ');
    input('edit-totalPrice', '0');
    click('edit-save');
    http.expectNone(request => request.method === 'PUT');
    expect(el('edit-description-error')).not.toBeNull();
    expect(el('edit-totalPrice-error')).not.toBeNull();
  });

  it('keeps confirmed changes when refreshing the budget fails', () => {
    open();
    input('edit-description', 'Salva');
    click('edit-save');
    http.expectOne(`${api}/expenses/expense`).flush({ ...saved, description: 'Salva' });
    http.expectOne(`${api}/budgets?projectId=project`).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.expense()?.description).toBe('Salva');
    expect(el('expense-edit-modal')).toBeNull();
    expect(fixture.componentInstance.budgetError()).toContain('despesa está salva');
  });

  for (const method of ['edit-cancel', 'edit-close', 'escape']) {
    it(`abandons the draft via ${method} without saving or recovering it on reopening`, () => {
      open(); input('edit-description', 'Rascunho');
      if (method === 'escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      else click(method);
      fixture.detectChanges();
      expect(el('expense-edit-modal')).toBeNull(); http.expectNone(request => request.method === 'PUT');
      open(); expect((el('edit-description') as HTMLInputElement).value).toBe(saved.description);
    });
  }

  it('ignores the backdrop and prevents a duplicate submission while saving', () => {
    open(); click('expense-edit-backdrop'); expect(el('expense-edit-modal')).not.toBeNull();
    click('edit-save'); const request = http.expectOne(`${api}/expenses/expense`);
    expect((el('edit-save') as HTMLButtonElement).disabled).toBeTrue();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectNone(r => r.method === 'PUT');
    request.flush(saved); http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] });
  });

  for (const status of [0, 500]) {
    it(`keeps all draft fields after error ${status}, without automatic retry, and permits checking current state`, () => {
      open(); input('edit-description', 'Rascunho'); input('edit-purchaseDate', '2030-01-02');
      selectOption('edit-categoryId', 2); selectOption('edit-paid', 1); input('edit-dueDate', '2030-01-03');
      input('edit-totalPrice', '90000'); click('edit-save');
      const request = http.expectOne(`${api}/expenses/expense`);
      if (status === 0) request.error(new ProgressEvent('error'));
      else request.flush({}, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect((el('edit-description') as HTMLInputElement).value).toBe('Rascunho');
      expect((el('edit-purchaseDate') as HTMLInputElement).value).toBe('2030-01-02');
      expect((el('edit-categoryId') as HTMLSelectElement).value).toBe('other');
      expect((el('edit-dueDate') as HTMLInputElement).value).toBe('2030-01-03');
      expect((el('edit-totalPrice') as HTMLInputElement).value.replace(/\s/g, ' ')).toBe('R$ 900,00');
      expect((el('edit-save') as HTMLButtonElement).disabled).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('Não foi possível confirmar');
      http.expectNone(r => r.method === 'PUT');
      click('edit-check-state'); http.expectOne(`${api}/expenses/expense`).flush(saved);
      http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
      expect(el('expense-edit-modal')).toBeNull(); expect(fixture.componentInstance.expense()).toEqual(saved);
    });
  }
});
