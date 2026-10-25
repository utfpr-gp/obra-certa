import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
    const select = query<HTMLSelectElement>('budget-form-category');
    expect(select).not.toBeNull();
    expect(select!.disabled).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Editar orçamento');
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
    component.form.controls.estimatedAmount.setValue(1200);

    component.save();
    fixture.detectChanges();

    expect(query('budget-form-error')!.textContent).toContain(message);
    expect(query('budget-form-modal')).not.toBeNull();
    expect(query<HTMLInputElement>('budget-form-amount')!.value).toBe('1200');
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
