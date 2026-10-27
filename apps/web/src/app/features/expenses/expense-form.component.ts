import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SupplierService } from '../../core/services/supplier.service';
import { CategoryService } from '../../core/services/category.service';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { ExpenseCreate, ExpenseSupplier } from '../../core/models/expense-registration.model';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetCategory } from '../../core/models/budget.model';
import { BudgetFormModalComponent } from '../budgets-page/components/budget-form-modal/budget-form-modal.component';

@Component({
  selector: 'app-expense-form', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BudgetFormModalComponent],
  templateUrl: './expense-form.component.html',
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly expenses = inject(ExpenseService);
  private readonly supplierService = inject(SupplierService);
  private readonly categoryService = inject(CategoryService);
  private readonly budgetService = inject(BudgetService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly activeProject = inject(ActiveProjectService).activeProject;
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly suppliers = signal<ExpenseSupplier[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly saving = signal(false);
  readonly inlineSupplier = signal(false);
  readonly budgetCategories = signal<BudgetCategory[] | null>(null);
  readonly budgetError = signal('');
  readonly budgetContext = signal<{projectId: string; categoryId: string} | null>(null);
  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.pattern(/\S/)]],
    purchaseDate: ['', Validators.required],
    paid: [true], dueDate: [''],
    categoryId: ['', Validators.required],
    supplierId: ['', Validators.required],
    supplierName: [''], supplierDocument: [''],
    valueMode: ['DIRECT' as 'DIRECT' | 'CALCULATED'],
    totalPrice: [null as number | null, [Validators.required, positiveDecimal(13)]],
    quantity: [null as number | null], unitPrice: [null as number | null],
  });
  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly categoryWithoutBudget = computed(() => {
    const categoryId = this.values().categoryId;
    const categories = this.budgetCategories();
    if (!categoryId || categories === null) return false;
    const category = categories.find(item => item.categoryId === categoryId);
    return !category?.hasBudget || category.plannedAmount === 0;
  });
  readonly calculatedTotal = computed(() => {
    const value = this.values();
    if (!value.quantity || !value.unitPrice || !Number.isFinite(value.quantity) || !Number.isFinite(value.unitPrice)) return 0;
    // Integer hundredths keep the preview's HALF_UP rounding aligned with BigDecimal.
    const quantity = BigInt(Math.round(value.quantity * 100));
    const cents = BigInt(Math.round(value.unitPrice * 100));
    return Number((quantity * cents + 50n) / 100n) / 100;
  });

  constructor() {
    this.form.controls.valueMode.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.configureFields());
    this.form.controls.paid.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.configureFields());
    this.form.controls.purchaseDate.valueChanges.pipe(takeUntilDestroyed()).subscribe(() =>
      this.form.controls.dueDate.updateValueAndValidity({ emitEvent: false }));
    this.loadOptions();
    this.loadBudgets();
  }

  loadBudgets(): void {
    const projectId = this.activeProject()?.id;
    if (!projectId) return;
    this.budgetCategories.set(null);
    this.budgetError.set('');
    this.budgetService.getOverview(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: overview => {
        if (this.activeProject()?.id === projectId) this.budgetCategories.set(overview.categories);
      },
      error: () => {
        if (this.activeProject()?.id === projectId)
          this.budgetError.set('Não foi possível consultar o teto da categoria. Tente novamente.');
      },
    });
  }

  openBudget(): void {
    const projectId = this.activeProject()?.id;
    const categoryId = this.form.controls.categoryId.value;
    if (projectId && categoryId) this.budgetContext.set({projectId, categoryId});
  }

  budgetSaved(category: BudgetCategory): void {
    if (this.budgetContext()?.projectId === this.activeProject()?.id) {
      this.budgetCategories.update(categories => [
        ...(categories ?? []).filter(item => item.categoryId !== category.categoryId), category,
      ]);
    }
    this.budgetContext.set(null);
  }

  loadOptions(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({ categories: this.categoryService.getCategories(), suppliers: this.supplierService.getSuppliers() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: options => {
          this.categories.set(options.categories); this.suppliers.set(options.suppliers); this.loading.set(false);
        },
        error: () => { this.loading.set(false); this.errorMessage.set('Não foi possível carregar categorias e fornecedores. Tente novamente.'); },
      });
  }

  toggleSupplier(): void {
    this.inlineSupplier.update(value => !value);
    this.configureFields();
  }

  private configureFields(): void {
    const calculated = this.form.controls.valueMode.value === 'CALCULATED';
    const controls = this.form.controls;
    controls.dueDate.setValidators(controls.paid.value ? [] : [Validators.required, control =>
      control.value && controls.purchaseDate.value && control.value < controls.purchaseDate.value
        ? {beforePurchase: true} : null]);
    controls.totalPrice.setValidators(calculated ? [] : [Validators.required, positiveDecimal(13)]);
    controls.quantity.setValidators(calculated ? [Validators.required, positiveDecimal(8)] : []);
    controls.unitPrice.setValidators(calculated ? [Validators.required, positiveDecimal(13)] : []);
    controls.supplierId.setValidators(this.inlineSupplier() ? [] : [Validators.required]);
    controls.supplierName.setValidators(this.inlineSupplier() ? [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)] : []);
    controls.supplierDocument.setValidators(this.inlineSupplier() ? [Validators.required, cnpjFormat] : []);
    for (const control of Object.values(controls)) control.updateValueAndValidity({ emitEvent: false });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  money(value: number | null): string {
    return value === null ? '' : new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(value);
  }

  onMoneyInput(event: Event, field: 'totalPrice' | 'unitPrice'): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const cents = Number(digits);
    if (!Number.isSafeInteger(cents)) { input.value = this.money(this.form.controls[field].value); return; }
    this.form.controls[field].setValue(digits ? cents / 100 : null);
    this.form.controls[field].markAsDirty();
    input.value = this.money(this.form.controls[field].value);
  }

  save(): void {
    if (this.saving() || this.loading()) return;
    this.form.markAllAsTouched();
    const projectId = this.activeProject()?.id;
    if (this.form.invalid || !projectId) return;
    const value = this.form.getRawValue();
    const calculated = value.valueMode === 'CALCULATED';
    if (calculated && (this.calculatedTotal() <= 0 || this.calculatedTotal() >= 1e13)) {
      this.errorMessage.set('O total calculado deve ser positivo e estar dentro do limite permitido.'); return;
    }
    const request: ExpenseCreate = {
      projectId, description: value.description.trim(), purchaseDate: value.purchaseDate,
      categoryId: value.categoryId, paid: value.paid, valueMode: value.valueMode,
      ...(!value.paid ? {dueDate: value.dueDate} : {}),
      ...(this.inlineSupplier() ? { newSupplier: {name: value.supplierName.trim(), document: value.supplierDocument} }
        : { supplierId: value.supplierId }),
      ...(calculated ? {quantity: value.quantity!, unitPrice: value.unitPrice!} : {totalPrice: value.totalPrice!}),
    };
    this.saving.set(true); this.errorMessage.set('');
    this.expenses.create(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: expense => { this.saving.set(false); void this.router.navigate(['/despesas',expense.id]); },
      error: () => { this.saving.set(false); this.errorMessage.set('Não foi possível confirmar o salvamento. Confira os dados e tente novamente.'); },
    });
  }
}

function positiveDecimal(integers: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '') return null;
    return Number.isFinite(value) && value > 0 && value < 10 ** integers && /^\d+(\.\d{1,2})?$/.test(String(value))
      ? null : {invalidAmount: true};
  };
}
function cnpjFormat(control: AbstractControl): ValidationErrors | null {
  return /^\d{14}$/.test(String(control.value).replace(/[./\s-]/g,'')) ? null : {invalidCnpj: true};
}
