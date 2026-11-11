import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, merge, Subject, switchMap } from 'rxjs';
import { BudgetCategory, SinapiAvailability, SinapiReferences } from '../../../../core/models/budget.model';
import { ExpenseCategory } from '../../../../core/models/expense-category.model';
import { BudgetService } from '../../../../core/services/budget.service';
import {
  allocateCents,
  estimateCents,
  FULL_ALLOCATION,
  initialPercent,
  parsePercent,
  PercentError,
  prdOrder,
  shareCents,
} from './sinapi-allocation';

export type AllocationError = PercentError | 'sum';

@Component({
  selector: 'app-sinapi-form',
  imports: [ReactiveFormsModule],
  templateUrl: './sinapi-form.component.html',
  styleUrl: './sinapi-form.component.css',
})
export class SinapiFormComponent {
  readonly categories = input.required<ExpenseCategory[]>();
  readonly projectId = input.required<string>();
  /** Tetos ativos da obra (inclusive zerados): entram na prévia como preservados. */
  readonly existingBudgets = input<BudgetCategory[]>([]);
  readonly cancelled = output<void>();
  /** Emitido somente depois que o servidor confirma a gravação do lote. */
  readonly confirmed = output<void>();
  readonly states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];
  readonly months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ].map((name, index) => ({ name, code: String(index + 1).padStart(2, '0') }));
  readonly projectGroups = [
    {
      name: 'Casa popular',
      projects: [
        { id: '7101', name: 'Térrea de 1 quarto' },
        { id: '7088', name: 'Térrea de 2 quartos' },
        { id: '7087', name: 'Térrea de 2 quartos com varanda' },
        { id: '7102', name: 'Sobrado de 3 quartos' },
      ],
    },
    {
      name: 'Casa residencial',
      projects: [
        { id: '7089', name: 'Térrea de 2 quartos' },
        { id: '7090', name: 'Térrea de 3 quartos' },
        { id: '7091', name: 'Térrea de 4 quartos' },
        { id: '7103', name: 'Sobrado geminado de 2 quartos' },
      ],
    },
  ];
  readonly allocationMessages: Record<AllocationError, string> = {
    missing: 'Informe o percentual de todas as categorias.',
    negative: 'Os percentuais devem ser não negativos.',
    precision: 'Use no máximo duas casas decimais nos percentuais.',
    sum: 'A soma dos percentuais deve ser 100%.',
  };

  private readonly formBuilder = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);
  readonly currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  readonly selection = this.formBuilder.nonNullable.group({
    state: ['', Validators.required],
    year: [String(new Date().getFullYear()), [Validators.required, Validators.pattern(/^(?!0000)\d{4}$/)]],
    month: [{ value: '', disabled: true }, Validators.required],
    project: [{ value: '', disabled: true }, Validators.required],
  });
  readonly area = new FormControl<number | null>(null);
  readonly finish = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  private readonly allocation = this.formBuilder.record<FormControl<number | null>>({});

  readonly loading = signal(false);
  readonly availability = signal<SinapiAvailability | null>(null);
  readonly availabilityLoading = signal(false);
  readonly availabilityFailed = signal(false);
  private readonly selectedMonth = signal('');
  readonly availableProjects = computed(() => this.availability()?.months[this.selectedMonth()] ?? []);
  readonly lookupFailed = signal(false);
  readonly references = signal<SinapiReferences | null>(null);
  readonly saving = signal(false);
  readonly confirmError = signal<'stale' | 'failed' | null>(null);
  private readonly retryLookup = new Subject<void>();
  private readonly availabilityContextChanged = new Subject<string>();
  private readonly retryAvailabilityLookup = new Subject<void>();
  private readonly areaValue = toSignal(this.area.valueChanges, { initialValue: null });
  private readonly finishId = toSignal(this.finish.valueChanges, { initialValue: '' });
  private readonly percentages = toSignal(this.allocation.valueChanges, {
    initialValue: this.allocation.getRawValue(),
  });

  private readonly estimateInput = computed(() => {
    const area = this.areaValue();
    const references = this.references();
    const reference = references?.finishes.find(({ id }) => id === this.finishId());
    if (!references || !reference || area === null || !Number.isFinite(area) || area <= 0) return null;
    return { source: references.source, unitCost: reference.unitCost, area };
  });

  /** Entrada que não tem forma decimal simples (ex.: área 0,0000001): a prévia não aparece e o motivo é mostrado. */
  readonly estimateInvalid = computed(() => {
    const input = this.estimateInput();
    return input !== null && estimateCents(input.unitCost, input.area) === null;
  });

  readonly preview = computed(() => {
    const input = this.estimateInput();
    if (!input) return null;

    const estimate = estimateCents(input.unitCost, input.area);
    if (estimate === null) return null;

    const percentages = this.percentages();
    const entries = this.categories().flatMap(category => {
      const control = this.allocation.controls[category.id];
      if (!control) return [];
      return [{ category, control, parsed: parsePercent(percentages[category.id] ?? null) }];
    });

    const sum = entries.reduce((acc, { parsed }) => (parsed.ok ? acc + parsed.hundredths : acc), 0);
    const failed = entries.find(({ parsed }) => !parsed.ok)?.parsed;
    const error: AllocationError | null = failed
      ? (failed.ok ? null : failed.reason)
      : (sum === FULL_ALLOCATION ? null : 'sum');

    const existing = new Map(
      this.existingBudgets().filter(row => row.hasBudget).map(row => [row.categoryId, row.plannedAmount]),
    );
    const amounts = new Map<string, number | null>();
    if (error === null) {
      const ordered = entries.slice().sort((a, b) => prdOrder(a.category.name) - prdOrder(b.category.name));
      const parcels = allocateCents(estimate, ordered.map(({ parsed }) => (parsed.ok ? parsed.hundredths : 0)));
      ordered.forEach(({ category }, index) => amounts.set(category.id, parcels[index]));
    } else {
      for (const { category, parsed } of entries) {
        amounts.set(category.id, parsed.ok ? shareCents(estimate, parsed.hundredths) : null);
      }
    }

    return {
      source: input.source,
      unitCost: input.unitCost,
      estimateCents: estimate,
      allocationValid: error === null,
      allocationSum: sum,
      allocationError: error,
      rows: entries.map(({ category, control }) => ({
        category,
        control,
        amountCents: amounts.get(category.id) ?? null,
        existingAmount: existing.get(category.id) ?? null,
      })),
    };
  });

  readonly canConfirm = computed(() => {
    const result = this.preview();
    return result !== null && result.allocationValid && !this.saving();
  });

  constructor() {
    effect(() => {
      const categories = this.categories();
      const categoryIds = new Set(categories.map(({ id }) => id));
      for (const id of Object.keys(this.allocation.controls)) {
        if (!categoryIds.has(id)) this.allocation.removeControl(id, { emitEvent: false });
      }
      for (const { id, name } of categories) {
        if (!this.allocation.contains(id)) {
          this.allocation.addControl(id, new FormControl(initialPercent(name)), {
            emitEvent: false,
          });
        }
      }
      this.allocation.updateValueAndValidity();
    });

    const { state, year, month, project } = this.selection.controls;

    merge(project.valueChanges, this.retryLookup).pipe(
      switchMap(() => {
        this.finish.reset({ value: '', disabled: true });
        this.resetAllocation();
        this.references.set(null);
        this.lookupFailed.set(false);
        this.confirmError.set(null);
        const canLookUp = this.availableProjects().includes(project.value);
        this.loading.set(canLookUp);
        if (!canLookUp) return EMPTY;

        return this.budgetService.getSinapiReferences(this.projectId(), state.value, month.value, project.value).pipe(
          catchError(() => {
            this.loading.set(false);
            this.lookupFailed.set(true);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(references => {
      this.references.set(references);
      this.loading.set(false);
      if (references.finishes.length) this.finish.enable();
    });

    month.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.selectedMonth.set(value);
      project.reset({ value: '', disabled: this.availableProjects().length === 0 });
    });

    merge(state.valueChanges, year.valueChanges, this.availabilityContextChanged, this.retryAvailabilityLookup).pipe(
      switchMap(() => {
        this.availability.set(null);
        month.reset({ value: '', disabled: true });
        this.availabilityFailed.set(false);
        const canLookUp = state.valid && year.valid;
        this.availabilityLoading.set(canLookUp);
        if (!canLookUp) return EMPTY;

        return this.budgetService.getSinapiAvailability(this.projectId(), state.value, year.value).pipe(
          catchError(() => {
            this.availabilityLoading.set(false);
            this.availabilityFailed.set(true);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(availability => {
      this.availability.set(availability);
      this.availabilityLoading.set(false);
      month.enable({ emitEvent: false });
    });

    effect(() => {
      const projectId = this.projectId();
      untracked(() => this.availabilityContextChanged.next(projectId));
    });
  }

  retryAvailability(): void {
    this.retryAvailabilityLookup.next();
  }

  retry(): void {
    this.retryLookup.next();
  }

  /** Envia a seleção, o custo exibido e os percentuais em ordem do PRD. Só confirma após resposta do servidor. */
  confirm(): void {
    const preview = this.preview();
    const input = this.estimateInput();
    if (!preview || !input || !preview.allocationValid || this.saving()) return;

    const percentages: { categoryId: string; percentage: number }[] = [];
    const ordered = preview.rows.slice().sort((a, b) => prdOrder(a.category.name) - prdOrder(b.category.name));
    for (const row of ordered) {
      const parsed = parsePercent(row.control.value);
      if (!parsed.ok) return;
      percentages.push({ categoryId: row.category.id, percentage: parsed.hundredths / 100 });
    }

    const { state, month, project } = this.selection.getRawValue();
    this.saving.set(true);
    this.confirmError.set(null);
    this.budgetService.confirmSinapi(this.projectId(), {
      uf: state,
      month,
      projectType: project,
      finishId: this.finishId(),
      area: input.area,
      unitCost: input.unitCost,
      percentages,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.confirmed.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.confirmError.set(error instanceof HttpErrorResponse && error.status === 409 ? 'stale' : 'failed');
      },
    });
  }

  resetAllocation(): void {
    this.allocation.reset(Object.fromEntries(this.categories().map(({ id, name }) => [
      id, initialPercent(name),
    ])));
  }

  formatCents(cents: number): string {
    return this.currency.format(cents / 100);
  }

  percentText(hundredths: number): string {
    return String(hundredths / 100);
  }
}
