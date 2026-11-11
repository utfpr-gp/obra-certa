import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { BudgetCategory, SinapiAvailability } from '../../../../core/models/budget.model';
import { ExpenseCategory } from '../../../../core/models/expense-category.model';
import { BudgetService } from '../../../../core/services/budget.service';
import { SinapiFormComponent } from './sinapi-form.component';

/** Tabela inicial de percentuais da US15 no PRD (docs/prd.md, "Percentuais iniciais"). */
const PRD_ROWS = [
  { id: 'cat-fundacao', name: 'Fundação e Estrutura', percent: '25' },
  { id: 'cat-alvenaria', name: 'Alvenaria', percent: '14' },
  { id: 'cat-eletrica', name: 'Elétrica', percent: '8' },
  { id: 'cat-hidraulica', name: 'Hidráulica', percent: '9' },
  { id: 'cat-telhado', name: 'Telhado e Cobertura', percent: '10' },
  { id: 'cat-esquadrias', name: 'Esquadrias e Vidros', percent: '10' },
  { id: 'cat-acabamento', name: 'Acabamento e Pintura', percent: '24' },
  { id: 'cat-mao-de-obra', name: 'Mão de Obra', percent: '0' },
  { id: 'cat-taxas', name: 'Taxas e Serviços', percent: '0' },
];

const prdCategories: ExpenseCategory[] = PRD_ROWS.map(({ id, name }) => ({ id, name }));
const PROJECT_IDS = ['7101', '7088', '7087', '7102', '7089', '7090', '7091', '7103'];

/** Mesma destruição que o modal faz ao fechar: o `@if` remove o formulário da tela. */
@Component({
  standalone: true,
  imports: [SinapiFormComponent],
  template: `
    @if (open) {
      <app-sinapi-form [categories]="categories" [projectId]="'project-1'"
        (cancelled)="open = false" />
    }
  `,
})
class SinapiFormHostComponent {
  open = true;
  readonly categories = prdCategories;
}

/** Conteúdo persistente do navegador, para provar que o fluxo SINAPI não grava nada. */
function storageSnapshot(): string {
  const collect = (storage: Storage): Record<string, string> => {
    const entries: Record<string, string> = {};
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)!;
      entries[key] = storage.getItem(key) ?? '';
    }
    return entries;
  };
  return JSON.stringify({
    local: collect(localStorage),
    session: collect(sessionStorage),
    cookie: document.cookie,
  });
}

describe('SinapiFormComponent — rateio editável', () => {
  let fixture: ComponentFixture<SinapiFormComponent>;
  let component: SinapiFormComponent;
  let budgetService: jasmine.SpyObj<BudgetService>;

  function query<T extends Element>(testId: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(`[data-testid="${testId}"]`);
  }

  function text(testId: string): string {
    return (query(testId)?.textContent ?? '').replace(/\s/g, ' ').trim();
  }

  function change(testId: string, value: string, event = 'change'): void {
    const field = query<HTMLInputElement | HTMLSelectElement>(testId)!;
    field.value = value;
    field.dispatchEvent(new Event(event));
    fixture.detectChanges();
  }

  function percent(id: string): HTMLInputElement {
    return query<HTMLInputElement>(`sinapi-percent-${id}`)!;
  }

  function mount(categories: ExpenseCategory[] = prdCategories, existing: BudgetCategory[] = []): void {
    fixture = TestBed.createComponent(SinapiFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('projectId', 'project-1');
    fixture.componentRef.setInput('existingBudgets', existing);
    fixture.detectChanges();
  }

  function existingBudget(categoryId: string, categoryName: string, plannedAmount: number): BudgetCategory {
    return {
      categoryId,
      categoryName,
      plannedAmount,
      spentAmount: 0,
      balanceAmount: plannedAmount,
      percentage: null,
      state: plannedAmount === 0 ? 'NO_BUDGET' : 'ON_TRACK',
      hasBudget: true,
    };
  }

  function serve(unitCost: number): void {
    budgetService.getSinapiReferences.and.returnValue(of({
      source: 'SIDRA/IBGE',
      finishes: [{ id: '787', name: 'Normal', unitCost }],
    }));
  }

  function pick(project = '7101'): void {
    change('sinapi-year', '2026', 'input');
    change('sinapi-state', 'PR');
    change('sinapi-month', '2026-09');
    change('sinapi-project', project);
    change('sinapi-finish', '787');
  }

  beforeEach(async () => {
    budgetService = jasmine.createSpyObj<BudgetService>('BudgetService',
      ['getSinapiAvailability', 'getSinapiReferences', 'confirmSinapi']);
    budgetService.getSinapiAvailability.and.returnValue(of({ months: { '2026-09': PROJECT_IDS } }));
    await TestBed.configureTestingModule({
      imports: [SinapiFormComponent, SinapiFormHostComponent],
      providers: [{ provide: BudgetService, useValue: budgetService }],
    }).compileComponents();
  });

  it('disables months and projects with no positive reference', () => {
    mount();
    budgetService.getSinapiAvailability.and.returnValue(of({
      months: { '2026-09': ['7090'], '2026-11': [] },
    }));
    change('sinapi-year', '2026', 'input');
    change('sinapi-state', 'PR');
    const months = query<HTMLSelectElement>('sinapi-month')!;
    expect(months.querySelector<HTMLOptionElement>('option[value="2026-11"]')!.disabled).toBeTrue();
    expect(months.querySelector<HTMLOptionElement>('option[value="2026-11"]')!.textContent)
      .toContain('indisponível');
    change('sinapi-month', '2026-09');
    const projects = query<HTMLSelectElement>('sinapi-project')!;
    expect(projects.querySelector<HTMLOptionElement>('option[value="7101"]')!.disabled).toBeTrue();
    expect(projects.querySelector<HTMLOptionElement>('option[value="7090"]')!.disabled).toBeFalse();
  });

  it('retries availability and ignores the previous UF response', () => {
    const old = new Subject<SinapiAvailability>();
    const latest = new Subject<SinapiAvailability>();
    budgetService.getSinapiAvailability.and.returnValues(
      old, throwError(() => new Error('SIDRA indisponível')), latest,
    );
    mount();
    change('sinapi-year', '2025', 'input');
    change('sinapi-state', 'PR');
    change('sinapi-state', 'SP');
    expect(query('sinapi-availability-error')).not.toBeNull();
    query<HTMLButtonElement>('sinapi-availability-retry')!.click();
    latest.next({ months: { '2025-08': ['7090'] } });
    old.next({ months: { '2025-09': ['7101'] } });
    fixture.detectChanges();

    expect(budgetService.getSinapiAvailability.calls.mostRecent().args)
      .toEqual(['project-1', 'SP', '2025']);
    expect(query<HTMLInputElement>('sinapi-year')!.value).toBe('2025');
    const months = query<HTMLSelectElement>('sinapi-month')!;
    expect(months.querySelector<HTMLOptionElement>('option[value="2025-08"]')!.disabled).toBeFalse();
    expect(months.querySelector<HTMLOptionElement>('option[value="2025-09"]')!.disabled).toBeTrue();
  });

  for (const project of PROJECT_IDS) {
    it(`loads the PRD percentages with the exact sum of 100% for project ${project}`, () => {
      mount();
      serve(2221.06);
      change('sinapi-area', '100', 'input');
      pick(project);

      for (const row of PRD_ROWS) expect(percent(row.id).value).toBe(row.percent);
      expect(component.preview()!.allocationValid).toBeTrue();
      expect(text('sinapi-allocation-sum')).toBe('Soma dos percentuais: 100%');
      expect(query('sinapi-allocation-error')).toBeNull();
    });
  }

  it('splits 10 centavos into R$ 0,03, R$ 0,03 and R$ 0,04 for 33%, 33% and 34%', () => {
    mount(prdCategories.filter(({ id }) => ['cat-alvenaria', 'cat-eletrica', 'cat-hidraulica'].includes(id)));
    serve(0.1);
    change('sinapi-area', '1', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '33', 'input');
    change('sinapi-percent-cat-eletrica', '33', 'input');
    change('sinapi-percent-cat-hidraulica', '34', 'input');

    expect(text('sinapi-amount-cat-alvenaria')).toBe('R$ 0,03');
    expect(text('sinapi-amount-cat-eletrica')).toBe('R$ 0,03');
    expect(text('sinapi-amount-cat-hidraulica')).toBe('R$ 0,04');
  });

  it('breaks equal fractions by the PRD order, not by the order of the categories', () => {
    mount([
      { id: 'cat-hidraulica', name: 'Hidráulica' },
      { id: 'cat-eletrica', name: 'Elétrica' },
      { id: 'cat-alvenaria', name: 'Alvenaria' },
    ]);
    serve(0.1);
    change('sinapi-area', '1', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '25', 'input');
    change('sinapi-percent-cat-eletrica', '25', 'input');
    change('sinapi-percent-cat-hidraulica', '50', 'input');

    expect(text('sinapi-amount-cat-alvenaria')).toBe('R$ 0,03');
    expect(text('sinapi-amount-cat-eletrica')).toBe('R$ 0,02');
    expect(text('sinapi-amount-cat-hidraulica')).toBe('R$ 0,05');
  });

  it('rounds the estimate half up: R$ 0,05 × 0,5 m² = 2,5 centavos becomes R$ 0,03', () => {
    mount([{ id: 'cat-alvenaria', name: 'Alvenaria' }]);
    serve(0.05);
    change('sinapi-area', '0.5', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '100', 'input');

    expect(text('sinapi-estimate')).toBe('R$ 0,03');
    expect(text('sinapi-amount-cat-alvenaria')).toBe('R$ 0,03');
  });

  it('keeps the parcels in centavos equal to the estimate: 1,0201 becomes 102 centavos split as 34, 34 and 34', () => {
    mount(prdCategories.filter(({ id }) => ['cat-alvenaria', 'cat-eletrica', 'cat-hidraulica'].includes(id)));
    serve(1.01);
    change('sinapi-area', '1.01', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '33.33', 'input');
    change('sinapi-percent-cat-eletrica', '33.33', 'input');
    change('sinapi-percent-cat-hidraulica', '33.34', 'input');

    const preview = component.preview()!;
    expect(preview.estimateCents).toBe(102);
    expect(preview.rows.reduce((sum, row) => sum + (row.amountCents ?? 0), 0)).toBe(102);
    expect(text('sinapi-estimate')).toBe('R$ 1,02');
    expect(text('sinapi-amount-cat-alvenaria')).toBe('R$ 0,34');
    expect(text('sinapi-amount-cat-eletrica')).toBe('R$ 0,34');
    expect(text('sinapi-amount-cat-hidraulica')).toBe('R$ 0,34');
    expect(preview.allocationValid).toBeTrue();
  });

  it('blocks the rateio with a negative percentage', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '-1', 'input');

    expect(component.preview()!.allocationValid).toBeFalse();
    expect(text('sinapi-allocation-error')).toBe('Os percentuais devem ser não negativos.');
  });

  it('blocks the rateio when the sum is not 100% and releases it when corrected', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '15', 'input');

    expect(component.preview()!.allocationValid).toBeFalse();
    expect(text('sinapi-allocation-sum')).toBe('Soma dos percentuais: 101%');
    expect(text('sinapi-allocation-error')).toBe('A soma dos percentuais deve ser 100%.');

    change('sinapi-percent-cat-alvenaria', '14', 'input');
    expect(component.preview()!.allocationValid).toBeTrue();
    expect(query('sinapi-allocation-error')).toBeNull();
  });

  it('blocks the rateio when a percentage is missing', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '', 'input');

    expect(component.preview()!.allocationValid).toBeFalse();
    expect(text('sinapi-allocation-error')).toBe('Informe o percentual de todas as categorias.');
  });

  it('blocks a percentage with more than two decimal places instead of rounding it silently', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '14.001', 'input');

    expect(component.preview()!.allocationValid).toBeFalse();
    expect(text('sinapi-allocation-error')).toBe('Use no máximo duas casas decimais nos percentuais.');
  });

  it('emits cancelled once and does not consult SINAPI again', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '50', 'input');
    expect(percent('cat-alvenaria').value).toBe('50');

    const callsBefore = budgetService.getSinapiReferences.calls.count();
    let cancelled = 0;
    component.cancelled.subscribe(() => cancelled++);
    query<HTMLButtonElement>('sinapi-cancel')!.click();
    fixture.detectChanges();

    expect(cancelled).toBe(1);
    expect(budgetService.getSinapiReferences.calls.count()).toBe(callsBefore);
  });

  it('shows the preserved budgets in the preview, including a zeroed one, without changing them', () => {
    mount(prdCategories, [
      existingBudget('cat-alvenaria', 'Alvenaria', 0),
      existingBudget('cat-eletrica', 'Elétrica', 1500),
    ]);
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();

    expect(text('sinapi-preserved-cat-alvenaria')).toContain('Teto atual R$ 0,00 preservado');
    expect(text('sinapi-preserved-cat-eletrica')).toContain('Teto atual R$ 1.500,00 preservado');
    expect(query('sinapi-preserved-cat-fundacao')).toBeNull();
  });

  it('does not mark as preserved a category that only has expenses and no active budget', () => {
    mount(prdCategories, [
      {
        categoryId: 'cat-eletrica',
        categoryName: 'Categoria com despesa',
        plannedAmount: 0,
        spentAmount: 300,
        balanceAmount: -300,
        percentage: null,
        state: 'NO_BUDGET',
        hasBudget: false,
      },
    ]);
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();

    expect(query('sinapi-preserved-cat-eletrica')).toBeNull();
    expect(component.preview()!.rows.find(row => row.category.id === 'cat-eletrica')!.existingAmount).toBeNull();
  });

  it('confirms with the displayed unit cost, the selection and the percentages in PRD order', () => {
    mount([...prdCategories].reverse());
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick('7090');
    budgetService.confirmSinapi.and.returnValue(of({ created: [], preserved: [] }));

    query<HTMLButtonElement>('sinapi-confirm')!.click();
    fixture.detectChanges();

    expect(budgetService.confirmSinapi).toHaveBeenCalledOnceWith('project-1', {
      uf: 'PR',
      month: '2026-09',
      projectType: '7090',
      finishId: '787',
      area: 100,
      unitCost: 2221.06,
      percentages: PRD_ROWS.map(({ id, percent }) => ({ categoryId: id, percentage: Number(percent) })),
    });
  });

  it('emits confirmed only after the server accepts the batch', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    const response = new Subject<{ created: []; preserved: [] }>();
    budgetService.confirmSinapi.and.returnValue(response.asObservable());
    let confirmed = 0;
    component.confirmed.subscribe(() => confirmed++);

    query<HTMLButtonElement>('sinapi-confirm')!.click();
    fixture.detectChanges();
    expect(confirmed).toBe(0);

    response.next({ created: [], preserved: [] });
    response.complete();
    expect(confirmed).toBe(1);
  });

  it('asks for a new preview when the cost changed since the preview (409)', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    budgetService.confirmSinapi.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { message: 'O custo por m² mudou desde a prévia.' },
    })));
    let confirmed = 0;
    component.confirmed.subscribe(() => confirmed++);

    query<HTMLButtonElement>('sinapi-confirm')!.click();
    fixture.detectChanges();

    expect(confirmed).toBe(0);
    expect(text('sinapi-confirm-error')).toContain('Atualize a consulta para gerar uma nova prévia');
    expect(query('sinapi-retry-preview')).not.toBeNull();
  });

  it('blocks confirmation while the rateio is invalid', () => {
    mount();
    serve(2221.06);
    change('sinapi-area', '100', 'input');
    pick();
    change('sinapi-percent-cat-alvenaria', '15', 'input');

    expect(query<HTMLButtonElement>('sinapi-confirm')!.disabled).toBeTrue();
  });

  it('shows an explicit error instead of the preview when the estimate has no plain decimal form', () => {
    mount([{ id: 'cat-alvenaria', name: 'Alvenaria' }]);
    serve(2221.06);
    change('sinapi-area', '0.0000001', 'input');
    pick();

    expect(query('sinapi-preview')).toBeNull();
    expect(query('sinapi-percent-cat-alvenaria')).toBeNull();
    const error = query('sinapi-estimate-error');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(text('sinapi-estimate-error')).toBe('Não foi possível calcular a estimativa com estes valores. Revise a área informada.');
  });

  it('keeps the SINAPI lookup, confirmation and failure out of browser storage', () => {
    mount();
    const openDatabase = spyOn(indexedDB, 'open');
    const before = storageSnapshot();
    serve(4321.99);
    change('sinapi-area', '37', 'input');
    pick();
    expect(component.preview()).not.toBeNull();
    expect(storageSnapshot()).toBe(before);

    budgetService.confirmSinapi.and.returnValue(of({ created: [], preserved: [] }));
    query<HTMLButtonElement>('sinapi-confirm')!.click();
    fixture.detectChanges();
    expect(storageSnapshot()).toBe(before);

    budgetService.confirmSinapi.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 500,
      error: { message: 'Falha ao gravar' },
    })));
    query<HTMLButtonElement>('sinapi-confirm')!.click();
    fixture.detectChanges();
    expect(query('sinapi-confirm-error')).not.toBeNull();
    expect(storageSnapshot()).toBe(before);
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('a failed lookup leaves no query data in the state nor in browser storage', () => {
    const before = storageSnapshot();
    mount();
    budgetService.getSinapiReferences.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 503,
      error: { message: 'Indisponível' },
    })));

    change('sinapi-year', '2026', 'input');
    change('sinapi-state', 'PR');
    change('sinapi-month', '2026-09');
    change('sinapi-project', '7101');

    expect(component.references()).toBeNull();
    expect(component.preview()).toBeNull();
    expect(component.lookupFailed()).toBeTrue();
    expect(query('sinapi-preview')).toBeNull();
    expect(storageSnapshot()).toBe(before);
  });

  it('discards the SINAPI state from the live form when it is closed', () => {
    const hostFixture = TestBed.createComponent(SinapiFormHostComponent);
    hostFixture.detectChanges();
    const root = hostFixture.nativeElement as HTMLElement;
    const set = (testId: string, value: string, event = 'change'): void => {
      const field = root.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-testid="${testId}"]`)!;
      field.value = value;
      field.dispatchEvent(new Event(event));
      hostFixture.detectChanges();
    };

    serve(4321.99);
    set('sinapi-area', '37', 'input');
    set('sinapi-year', '2026', 'input');
    set('sinapi-state', 'PR');
    set('sinapi-month', '2026-09');
    set('sinapi-project', '7101');
    set('sinapi-finish', '787');
    expect(root.querySelector('[data-testid="sinapi-preview"]')).not.toBeNull();
    const before = storageSnapshot();

    root.querySelector<HTMLButtonElement>('[data-testid="sinapi-cancel"]')!.click();
    hostFixture.detectChanges();

    expect(root.querySelector('app-sinapi-form')).toBeNull();
    expect(root.querySelector('[data-testid="sinapi-preview"]')).toBeNull();
    expect(root.querySelector('[data-testid="sinapi-area"]')).toBeNull();
    expect(storageSnapshot()).toBe(before);
  });
});
