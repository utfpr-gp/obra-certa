import { Component, DestroyRef, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActiveProjectService } from '../../../../core/services/active-project.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { ExpenseResponse, ExpenseUpdate } from '../../../../core/models/expense-registration.model';
import { ExpenseCategory } from '../../../../core/models/expense-category.model';

@Component({
  selector: 'app-expense-edit-modal', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './expense-edit-modal.component.html',
})
export class ExpenseEditModalComponent implements OnInit {
  readonly expense = input.required<ExpenseResponse>();
  readonly saved = output<ExpenseResponse>();
  readonly cancel = output<void>();
  readonly checkState = output<void>();
  private readonly projects = inject(ActiveProjectService);
  private readonly expenses = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly version = this.projects.contextVersion();
  readonly project = this.projects.activeProject;
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly optionsError = signal('');
  readonly errorMessage = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    description: ['', [Validators.required, Validators.pattern(/\S/)]],
    purchaseDate: ['', Validators.required],
    categoryId: ['', Validators.required],
    paid: [true],
    dueDate: [''],
    valueMode: ['DIRECT' as 'DIRECT' | 'CALCULATED'],
    totalPrice: [null as number | null], quantity: [null as number | null], unitPrice: [null as number | null],
  }, {validators: control => {
    const value = control.value;
    if (value.valueMode !== 'CALCULATED' || !value.quantity || !value.unitPrice) return null;
    if (positiveDecimal(8)(control.get('quantity')!) || positiveDecimal(13)(control.get('unitPrice')!)) return null;
    const total = Number((BigInt(Math.round(value.quantity*100))*BigInt(Math.round(value.unitPrice*100))+50n)/100n)/100;
    return total > 0 && total < 1e13 ? null : {invalidTotal:true};
  }});

  constructor() {
    this.form.controls.valueMode.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.configureValues());
    this.form.controls.paid.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.configurePayment());
    this.form.controls.purchaseDate.valueChanges.pipe(takeUntilDestroyed()).subscribe(() =>
      this.form.controls.dueDate.updateValueAndValidity({emitEvent: false}));
  }
  ngOnInit(): void {
    const expense = this.expense();
    this.form.patchValue({
      description: expense.description,
      purchaseDate: expense.purchaseDate,
      categoryId: expense.categoryId,
      paid: expense.paid,
      dueDate: expense.dueDate ?? '',
      valueMode: expense.quantity === null ? 'DIRECT' : 'CALCULATED',
      quantity: expense.quantity,
      unitPrice: expense.unitPrice,
      totalPrice: expense.totalPrice
    });
    this.configureValues();
    this.configurePayment();
    this.loadCategories();
  }
  loadCategories(): void {
    this.loading.set(true); this.optionsError.set('');
    this.categoryService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: categories => { if (this.current()) { this.categories.set(categories); this.loading.set(false); } },
      error: () => { if (this.current()) { this.loading.set(false); this.optionsError.set('Não foi possível carregar categorias. Tente novamente.'); } },
    });
  }
  private current(): boolean { return this.projects.contextVersion() === this.version; }
  private configureValues(): void {
    const controls = this.form.controls, calculated = controls.valueMode.value === 'CALCULATED';
    controls.totalPrice.setValidators(calculated ? [] : [Validators.required, positiveDecimal(13)]);
    controls.quantity.setValidators(calculated ? [Validators.required, positiveDecimal(8)] : []);
    controls.unitPrice.setValidators(calculated ? [Validators.required, positiveDecimal(13)] : []);
    for (const control of [controls.totalPrice, controls.quantity, controls.unitPrice]) control.updateValueAndValidity({emitEvent: false});
  }
  private configurePayment(): void {
    const controls = this.form.controls;
    controls.dueDate.setValidators(controls.paid.value ? [] : [
      Validators.required,
      control => control.value && controls.purchaseDate.value && control.value < controls.purchaseDate.value
        ? {beforePurchase: true} : null
    ]);
    controls.dueDate.updateValueAndValidity({emitEvent: false});
  }
  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name]; return control.touched && control.invalid;
  }
  money(value: number | null): string {
    return value === null ? '' : new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(value);
  }
  onMoneyInput(event: Event, field: 'totalPrice' | 'unitPrice'): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g,'');
    const cents = Number(digits);
    if (!Number.isSafeInteger(cents)) { input.value = this.money(this.form.controls[field].value); return; }
    this.form.controls[field].setValue(digits ? cents/100 : null);
    this.form.controls[field].markAsDirty();
    input.value = this.money(this.form.controls[field].value);
  }
  @HostListener('document:keydown.escape') close(): void { this.cancel.emit(); }
  save(): void {
    if (!this.current() || !this.project() || this.saving() || this.loading() || this.optionsError()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const request: ExpenseUpdate = {
      description: value.description.trim(),
      purchaseDate: value.purchaseDate,
      categoryId: value.categoryId,
      valueMode: value.valueMode,
      paid: value.paid,
      ...(!value.paid && value.dueDate ? {dueDate: value.dueDate} : {}),
      ...(value.valueMode === 'CALCULATED' ? {quantity: value.quantity!, unitPrice: value.unitPrice!} : {totalPrice: value.totalPrice!})
    };
    this.saving.set(true); this.errorMessage.set('');
    this.expenses.update(this.expense().id, request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: expense => { if (this.current()) { this.saving.set(false); this.saved.emit(expense); } },
      error: () => { if (this.current()) { this.saving.set(false); this.errorMessage.set('Não foi possível confirmar o salvamento. Confira o estado atual antes de tentar novamente.'); } },
    });
  }
}
function positiveDecimal(integers: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '') return null;
    return Number.isFinite(value) && value > 0 && value < 10 ** integers && /^\d+(\.\d{1,2})?$/.test(String(value))
      ? null : {invalidAmount:true};
  };
}
