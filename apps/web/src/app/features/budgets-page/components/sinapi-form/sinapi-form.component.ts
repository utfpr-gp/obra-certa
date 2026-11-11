import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, map, switchMap, timer } from 'rxjs';
import { ExpenseCategory } from '../../../../core/models/expense-category.model';

interface FinishReference {
  id: string;
  name: string;
  unitCost: number;
}

const INITIAL_PERCENTAGES = new Map([
  ['Fundação e Estrutura', 25],
  ['Alvenaria', 14],
  ['Elétrica', 8],
  ['Hidráulica', 9],
  ['Telhado e Cobertura', 10],
  ['Esquadrias e Vidros', 10],
  ['Acabamento e Pintura', 24],
  ['Mão de Obra', 0],
  ['Taxas e Serviços', 0],
]);

@Component({
  selector: 'app-sinapi-form',
  imports: [ReactiveFormsModule],
  templateUrl: './sinapi-form.component.html',
  styleUrl: './sinapi-form.component.css',
})
export class SinapiFormComponent {
  readonly categories = input.required<ExpenseCategory[]>();
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

  private readonly formBuilder = inject(FormBuilder);
  readonly currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  readonly selection = this.formBuilder.nonNullable.group({
    state: ['', Validators.required],
    month: ['', [Validators.required, Validators.pattern(/^\d{4}-(0[1-9]|1[0-2])$/)]],
    project: ['', Validators.required],
  });
  readonly area = new FormControl<number | null>(null);
  readonly finish = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  private readonly allocation = this.formBuilder.record<FormControl<number | null>>({});

  readonly loading = signal(false);
  readonly references = signal<FinishReference[] | null>(null);
  private readonly areaValue = toSignal(this.area.valueChanges, { initialValue: null });
  private readonly finishId = toSignal(this.finish.valueChanges, { initialValue: '' });
  private readonly percentages = toSignal(this.allocation.valueChanges, {
    initialValue: this.allocation.getRawValue(),
  });

  readonly preview = computed(() => {
    const area = this.areaValue();
    const reference = this.references()?.find(({ id }) => id === this.finishId());
    if (!reference || area === null || !Number.isFinite(area) || area <= 0) return null;

    const estimate = reference.unitCost * area;
    return {
      unitCost: reference.unitCost,
      estimate,
      rows: this.categories().flatMap(category => {
        const control = this.allocation.controls[category.id];
        if (!control) return [];
        const percentage = this.percentages()[category.id];
        return [{ category, control, amount: percentage == null ? null : estimate * percentage / 100 }];
      }),
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
          this.allocation.addControl(id, new FormControl(INITIAL_PERCENTAGES.get(name) ?? 0), {
            emitEvent: false,
          });
        }
      }
      this.allocation.updateValueAndValidity();
    });

    this.selection.valueChanges.pipe(
      switchMap(({ state }) => {
        this.finish.reset({ value: '', disabled: true });
        this.resetAllocation();
        this.references.set(null);
        this.loading.set(this.selection.valid);
        if (this.selection.invalid) return EMPTY;

        // TODO #48: substituir a amostra local pela consulta ao SIDRA via BudgetService.
        return timer(350).pipe(map((): FinishReference[] => state === 'PR'
          ? [{ id: 'normal', name: 'Normal', unitCost: 1800 }]
          : []));
      }),
      takeUntilDestroyed(),
    ).subscribe(references => {
      this.references.set(references);
      this.loading.set(false);
      if (references.length) this.finish.enable();
    });
  }

  resetAllocation(): void {
    this.allocation.reset(Object.fromEntries(this.categories().map(({ id, name }) => [
      id, INITIAL_PERCENTAGES.get(name) ?? 0,
    ])));
  }
}
