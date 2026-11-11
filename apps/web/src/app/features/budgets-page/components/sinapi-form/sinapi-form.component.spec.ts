import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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

  function mount(categories: ExpenseCategory[] = prdCategories): void {
    fixture = TestBed.createComponent(SinapiFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('projectId', 'project-1');
    fixture.detectChanges();
  }

  function serve(unitCost: number): void {
    budgetService.getSinapiReferences.and.returnValue(of({
      source: 'SIDRA/IBGE',
      finishes: [{ id: '787', name: 'Normal', unitCost }],
    }));
  }

  function pick(project = '7101'): void {
    change('sinapi-state', 'PR');
    change('sinapi-month', '2026-09', 'input');
    change('sinapi-project', project);
    change('sinapi-finish', '787');
  }

  beforeEach(async () => {
    budgetService = jasmine.createSpyObj<BudgetService>('BudgetService', ['getSinapiReferences']);
    await TestBed.configureTestingModule({
      imports: [SinapiFormComponent],
      providers: [{ provide: BudgetService, useValue: budgetService }],
    }).compileComponents();
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
});
