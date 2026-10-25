import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, HostListener, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BudgetCategory } from '../../../../core/models/budget.model';
import { ExpenseCategory } from '../../../../core/models/expense-category.model';
import { BudgetService } from '../../../../core/services/budget.service';

/**
 * Formulario de criacao/edicao do teto de uma categoria. O modal recebe o
 * {@code projectId} capturado na abertura, entao o salvamento nunca depende da obra
 * ativa no instante da resposta.
 */
@Component({
  selector: 'app-budget-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budget-form-modal.component.html',
  styleUrl: './budget-form-modal.component.css',
})
export class BudgetFormModalComponent {
  private readonly budgetService = inject(BudgetService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private contextId = 0;

  readonly isOpen = input(false);
  readonly projectId = input<string | null>(null);
  /** Presente apenas na edicao: trava a categoria e preenche o valor atual. */
  readonly editingCategory = input<BudgetCategory | null>(null);
  /** Categoria ja escolhida ao abrir por "Definir teto". */
  readonly preselectedCategoryId = input<string | null>(null);
  readonly categories = input<ExpenseCategory[]>([]);

  readonly closed = output<void>();
  readonly saved = output<BudgetCategory>();

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly belowSpentConflict = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    categoryId: ['', Validators.required],
    estimatedAmount: [
      null as number | null,
      [Validators.required, positiveAmountWithTwoDecimals],
    ],
  });

  constructor() {
    effect(() => {
      this.contextId++;
      if (!this.isOpen()) {
        this.saving.set(false);
        this.form.reset();
        return;
      }
      const editing = this.editingCategory();
      this.errorMessage.set('');
      this.belowSpentConflict.set(false);
      this.saving.set(false);
      this.form.reset({
        categoryId: editing?.categoryId ?? this.preselectedCategoryId() ?? '',
        estimatedAmount: editing?.plannedAmount ?? null,
      });
      if (editing) {
        this.form.controls.categoryId.disable();
      } else {
        this.form.controls.categoryId.enable();
      }
    });
  }

  isEditing(): boolean {
    return this.editingCategory() !== null;
  }

  showCategoryError(): boolean {
    const control = this.form.controls.categoryId;
    return control.touched && control.invalid;
  }

  showAmountError(): boolean {
    const control = this.form.controls.estimatedAmount;
    return control.touched && control.invalid;
  }

  save(): void {
    if (!this.isOpen() || this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const value = this.form.getRawValue();
    const context = this.contextId;
    this.saving.set(true);
    this.errorMessage.set('');
    this.belowSpentConflict.set(false);
    this.budgetService
      .setBudget(projectId, value.categoryId, {
        estimatedAmount: value.estimatedAmount as number,
      })
      .subscribe({
        next: (category) => {
          if (!this.isCurrentContext(context, projectId)) return;
          this.saving.set(false);
          this.saved.emit(category);
        },
        error: (error: unknown) => {
          if (!this.isCurrentContext(context, projectId)) return;
          this.saving.set(false);
          if (error instanceof HttpErrorResponse && error.status === 409
              && typeof error.error?.message === 'string') {
            this.belowSpentConflict.set(true);
            this.errorMessage.set(error.error.message);
            return;
          }
          this.errorMessage.set('Não foi possível salvar o orçamento. Verifique sua conexão e tente novamente.');
        },
      });
  }

  close(): void {
    this.contextId++;
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }

  private isCurrentContext(context: number, projectId: string): boolean {
    return !this.destroyRef.destroyed && this.isOpen()
      && this.contextId === context && this.projectId() === projectId;
  }
}

/** Valor obrigatorio, positivo e com no maximo duas casas decimais. */
function positiveAmountWithTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0.01) {
    return { invalidAmount: true };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) {
    return { invalidAmount: true };
  }
  return null;
}
