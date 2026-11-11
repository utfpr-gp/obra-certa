import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, merge, Subject, switchMap } from 'rxjs';
import { SinapiReferences } from '../../../../core/models/budget.model';
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
  readonly cancelled = output<void>();
  readonly states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];
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
    month: ['', [Validators.required, Validators.pattern(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/)]],
    project: ['', Validators.required],
  });
  readonly area = new FormControl<number | null>(null);
  readonly finish = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  private readonly allocation = this.formBuilder.record<FormControl<number | null>>({});

  readonly loading = signal(false);
  readonly lookupFailed = signal(false);
  readonly references = signal<SinapiReferences | null>(null);
  private readonly retryLookup = new Subject<void>();
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
      })),
    };
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

    merge(this.selection.valueChanges, this.retryLookup).pipe(
      switchMap(() => {
        this.finish.reset({ value: '', disabled: true });
        this.resetAllocation();
        this.references.set(null);
        this.lookupFailed.set(false);
        this.loading.set(this.selection.valid);
        if (this.selection.invalid) return EMPTY;

        const { state, month, project } = this.selection.getRawValue();
        return this.budgetService.getSinapiReferences(this.projectId(), state, month, project).pipe(
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
  }

  retry(): void {
    this.retryLookup.next();
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
