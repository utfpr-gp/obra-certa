import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BudgetCategory } from '../../../../core/models/budget.model';
import { ExpenseCategory } from '../../../../core/models/expense-category.model';
import { BudgetService } from '../../../../core/services/budget.service';
import { BudgetFormModalComponent } from './budget-form-modal.component';

describe('BudgetFormModalComponent', () => {
  let fixture: ComponentFixture<BudgetFormModalComponent>;
  let component: BudgetFormModalComponent;
  let budgetService: jasmine.SpyObj<BudgetService>;

  const categories: ExpenseCategory[] = [
    { id: 'cat-alvenaria', name: 'Alvenaria' },
    { id: 'cat-hidraulica', name: 'Hidráulica' },
  ];

  const existing: BudgetCategory = {
    categoryId: 'cat-alvenaria',
    categoryName: 'Alvenaria',
    plannedAmount: 1000,
    spentAmount: 200,
    balanceAmount: 800,
    percentage: 20,
    state: 'ON_TRACK',
    hasBudget: true,
  };

  const recalculated: BudgetCategory = {
    ...existing,
    plannedAmount: 1800,
    balanceAmount: 1600,
    percentage: 11.1,
  };

  function query<T extends Element>(testId: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(
      `[data-testid="${testId}"]`,
    );
  }

  function typeAmount(value: string): HTMLInputElement {
    const input = query<HTMLInputElement>('budget-form-amount')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  }

  function visibleAmount(): string {
    return query<HTMLInputElement>('budget-form-amount')!.value.replace(/\s/g, ' ');
  }

  function open(overrides: {
    editingCategory?: BudgetCategory | null;
    preselectedCategoryId?: string | null;
  } = {}): void {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('projectId', 'project-1');
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('editingCategory', overrides.editingCategory ?? null);
    fixture.componentRef.setInput(
      'preselectedCategoryId',
      overrides.preselectedCategoryId ?? null,
    );
    fixture.detectChanges();
  }

  beforeEach(async () => {
    budgetService = jasmine.createSpyObj<BudgetService>('BudgetService', ['setBudget']);
    budgetService.setBudget.and.returnValue(of(recalculated));

    await TestBed.configureTestingModule({
      imports: [BudgetFormModalComponent],
      providers: [{ provide: BudgetService, useValue: budgetService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetFormModalComponent);
    component = fixture.componentInstance;
  });

  it('loads the current amount and locks the category when editing', () => {
    open({ editingCategory: existing });

    expect(component.form.controls.categoryId.disabled).toBeTrue();
    expect(component.form.controls.categoryId.value).toBe('cat-alvenaria');
    expect(component.form.controls.estimatedAmount.value).toBe(1000);
    expect(visibleAmount()).toBe('R$ 1.000,00');
    const select = query<HTMLSelectElement>('budget-form-category');
    expect(select).not.toBeNull();
    expect(select!.disabled).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Editar orçamento');
  });

  for (const [digits, amount, display] of [
    ['1', 0.01, 'R$ 0,01'],
    ['123', 1.23, 'R$ 1,23'],
    ['123456', 1234.56, 'R$ 1.234,56'],
  ] as const) {
    it(`formats ${digits} as cents while keeping the numeric reais payload`, () => {
      open({ preselectedCategoryId: 'cat-hidraulica' });
      typeAmount(digits);
      expect(visibleAmount()).toBe(display);
      expect(component.form.controls.estimatedAmount.value).toBe(amount);
      component.save();
      expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
        'project-1', 'cat-hidraulica', { estimatedAmount: amount },
      );
    });
  }

  it('formats successive digits immediately and supports backspace and replacement', () => {
    open({ preselectedCategoryId: 'cat-hidraulica' });
    const input = typeAmount('1');
    for (const digit of ['2', '3', '4', '5', '6']) typeAmount(input.value + digit);
    expect(visibleAmount()).toBe('R$ 1.234,56');
    typeAmount(input.value.slice(0, -1));
    expect(visibleAmount()).toBe('R$ 123,45');
    input.setSelectionRange(0, input.value.length);
    input.setRangeText('987', input.selectionStart!, input.selectionEnd!, 'end');
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(visibleAmount()).toBe('R$ 9,87');
    expect(input.inputMode).toBe('numeric');
  });

  it('accepts pasted BRL text and clears to a required null without sending', () => {
    open({ preselectedCategoryId: 'cat-hidraulica' });
    typeAmount('R$ 1.234,56');
    expect(visibleAmount()).toBe('R$ 1.234,56');
    expect(component.form.controls.estimatedAmount.value).toBe(1234.56);
    typeAmount('');
    expect(component.form.controls.estimatedAmount.value).toBeNull();
    query<HTMLInputElement>('budget-form-amount')!.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(component.form.controls.estimatedAmount.touched).toBeTrue();
    expect(query('budget-form-amount-error')).not.toBeNull();
    component.save();
    expect(budgetService.setBudget).not.toHaveBeenCalled();
  });

  it('keeps zero invalid after typing and clears the display when reopened for creation', () => {
    open({ editingCategory: existing });
    typeAmount('0');
    expect(visibleAmount()).toBe('R$ 0,00');
    component.save();
    expect(budgetService.setBudget).not.toHaveBeenCalled();
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    open({ preselectedCategoryId: 'cat-hidraulica' });
    expect(visibleAmount()).toBe('');
    expect(component.form.controls.estimatedAmount.value).toBeNull();
  });

  it('keeps the category selectable and preselected when defining a ceiling', () => {
    open({ preselectedCategoryId: 'cat-hidraulica' });

    expect(component.form.controls.categoryId.enabled).toBeTrue();
    expect(component.form.controls.categoryId.value).toBe('cat-hidraulica');
    expect(component.form.controls.estimatedAmount.value).toBeNull();
    expect(query<HTMLSelectElement>('budget-form-category')!.disabled).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Adicionar orçamento');
  });

  it('submits the typed value for the category and emits the recalculated category', () => {
    spyOn(component.saved, 'emit');
    spyOn(component.closed, 'emit');
    open({ editingCategory: existing });

    component.form.controls.estimatedAmount.setValue(1800);
    component.save();

    expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
      'project-1',
      'cat-alvenaria',
      { estimatedAmount: 1800 },
    );
    expect(component.saved.emit).toHaveBeenCalledWith(recalculated);
    expect(component.closed.emit).not.toHaveBeenCalled();
    expect(component.saving()).toBeFalse();
  });

  it('submits the preselected category together with the typed value', () => {
    open({ preselectedCategoryId: 'cat-hidraulica' });

    component.form.controls.estimatedAmount.setValue(900);
    component.save();

    expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
      'project-1',
      'cat-hidraulica',
      { estimatedAmount: 900 },
    );
  });

  it('does not call the API when the owner cancels', () => {
    spyOn(component.closed, 'emit');
    open({ editingCategory: existing });

    query<HTMLButtonElement>('budget-form-cancel')!.click();

    expect(component.closed.emit).toHaveBeenCalled();
    expect(budgetService.setBudget).not.toHaveBeenCalled();
  });

  for (const action of ['budget-form-cancel', 'budget-form-close', 'Escape']) {
    it(`abandons through ${action} without saving`, () => {
      spyOn(component.closed, 'emit');
      spyOn(component.saved, 'emit');
      open({ editingCategory: existing });
      component.form.controls.estimatedAmount.setValue(1800);
      if (action === 'Escape') {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      } else {
        query<HTMLButtonElement>(action)!.click();
      }
      expect(component.closed.emit).toHaveBeenCalledTimes(1);
      expect(component.saved.emit).not.toHaveBeenCalled();
      expect(budgetService.setBudget).not.toHaveBeenCalled();
    });
  }

  it('preserves the typed amount on backdrop click', () => {
    spyOn(component.closed, 'emit');
    open({ editingCategory: existing });
    component.form.controls.estimatedAmount.setValue(1800);
    (query('budget-form-modal')!.parentElement as HTMLElement).click();
    expect(component.closed.emit).not.toHaveBeenCalled();
    expect(component.form.controls.estimatedAmount.value).toBe(1800);
    expect(budgetService.setBudget).not.toHaveBeenCalled();
  });

  it('blocks repeated submission while the request is pending', () => {
    budgetService.setBudget.and.returnValue(new Subject<BudgetCategory>());
    open({ editingCategory: existing });
    component.save();
    fixture.detectChanges();
    expect(query<HTMLButtonElement>('budget-form-submit')!.disabled).toBeTrue();
    component.save();
    expect(budgetService.setBudget).toHaveBeenCalledTimes(1);
  });

  for (const response of ['success', 'error']) {
    it(`ignores a late ${response} after closing and reopening the same project`, () => {
      const pending = new Subject<BudgetCategory>();
      budgetService.setBudget.and.returnValues(pending, new Subject<BudgetCategory>());
      spyOn(component.saved, 'emit');
      open({ editingCategory: existing });
      component.save();
      component.close();
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      open({ editingCategory: existing });
      component.form.controls.estimatedAmount.setValue(1900);
      component.save();
      if (response === 'success') pending.next(recalculated);
      else pending.error(new HttpErrorResponse({ status: 409, error: { message: 'old error' } }));
      expect(component.saved.emit).not.toHaveBeenCalled();
      expect(component.form.controls.estimatedAmount.value).toBe(1900);
      expect(component.errorMessage()).toBe('');
      expect(component.saving()).toBeTrue();
    });
  }

  for (const amount of [null, 0, -1, 1.234]) {
    it(`blocks invalid amount ${amount} with the validation message`, () => {
      open({ preselectedCategoryId: 'cat-hidraulica' });
      component.form.controls.estimatedAmount.setValue(amount);
      component.save();
      fixture.detectChanges();

      expect(budgetService.setBudget).not.toHaveBeenCalled();
      expect(query('budget-form-amount-error')!.textContent)
        .toContain('Informe um valor positivo com até duas casas decimais.');
    });
  }

  it('shows the API conflict message and keeps the form open with the typed amount', () => {
    const message = 'O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ 1.234,56';
    budgetService.setBudget.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { message },
    })));
    spyOn(component.saved, 'emit');
    spyOn(component.closed, 'emit');
    open({ editingCategory: existing });
    typeAmount('120000');

    component.save();
    fixture.detectChanges();

    expect(query('budget-form-error')!.textContent).toContain(message);
    expect(query('budget-form-modal')).not.toBeNull();
    expect(visibleAmount()).toBe('R$ 1.200,00');
    expect(budgetService.setBudget).toHaveBeenCalledWith(
      'project-1', 'cat-alvenaria', { estimatedAmount: 1200 },
    );
    expect(component.saved.emit).not.toHaveBeenCalled();
    expect(component.closed.emit).not.toHaveBeenCalled();
    expect(query<HTMLButtonElement>('budget-form-submit')!.disabled).toBeFalse();
  });

  it('blocks the submission when the amount is empty without calling the API', () => {
    open({ preselectedCategoryId: 'cat-hidraulica' });
    spyOn(component.closed, 'emit');

    component.save();
    fixture.detectChanges();

    expect(budgetService.setBudget).not.toHaveBeenCalled();
    expect(component.form.controls.estimatedAmount.touched).toBeTrue();
    expect(query('budget-form-amount-error')).not.toBeNull();
    expect(component.closed.emit).not.toHaveBeenCalled();
  });
});
