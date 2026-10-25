import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { BudgetService } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetCategory, BudgetOverview } from '../../core/models/budget.model';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { Project, ProjectStatus, ProjectType } from '../../core/models/project.model';
import { BudgetsPageComponent } from './budgets-page.component';

describe('BudgetsPageComponent', () => {
  let fixture: ComponentFixture<BudgetsPageComponent>;
  let component: BudgetsPageComponent;
  let activeProjectService: ActiveProjectService;
  let budgetService: jasmine.SpyObj<BudgetService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const project: Project = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Obra ativa',
    type: ProjectType.RENOVATION,
    location: 'Rua da obra',
    status: ProjectStatus.IN_PROGRESS,
    createdAt: '',
    updatedAt: '',
  };

  const categories: ExpenseCategory[] = [
    { id: 'cat-alvenaria', name: 'Alvenaria' },
    { id: 'cat-eletrica', name: 'Elétrica' },
    { id: 'cat-hidraulica', name: 'Hidráulica' },
    { id: 'cat-mao-de-obra', name: 'Mão de Obra' },
  ];

  const overview: BudgetOverview = {
    projectId: project.id,
    totalPlanned: 15000,
    totalSpent: 8500,
    available: 6500,
    globalPercentage: 56.7,
    exceededCategories: 1,
    budgetedCategories: 3,
    categories: [
      category({
        categoryId: 'cat-alvenaria',
        categoryName: 'Alvenaria',
        plannedAmount: 1000,
        spentAmount: 1125,
        balanceAmount: -125,
        percentage: 112.5,
        state: 'EXCEEDED',
      }),
      category({
        categoryId: 'cat-eletrica',
        categoryName: 'Elétrica',
        plannedAmount: 1000,
        spentAmount: 900,
        balanceAmount: 100,
        percentage: 90,
        state: 'WARNING',
      }),
      category({
        categoryId: 'cat-mao-de-obra',
        categoryName: 'Mão de Obra',
        plannedAmount: 5000,
        spentAmount: 500,
        balanceAmount: 4500,
        percentage: 10,
        state: 'ON_TRACK',
      }),
      category({
        categoryId: 'cat-hidraulica',
        categoryName: 'Hidráulica',
        plannedAmount: 0,
        spentAmount: 300,
        balanceAmount: -300,
        percentage: null,
        state: 'NO_BUDGET',
        hasBudget: false,
      }),
    ],
  };

  function category(overrides: Partial<BudgetCategory>): BudgetCategory {
    return {
      categoryId: 'cat',
      categoryName: 'Categoria',
      plannedAmount: 0,
      spentAmount: 0,
      balanceAmount: 0,
      percentage: null,
      state: 'NO_BUDGET',
      hasBudget: true,
      ...overrides,
    };
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function query<T extends Element>(testId: string): T | null {
    return page().querySelector<T>(`[data-testid="${testId}"]`);
  }

  function text(testId: string): string {
    const element = query<HTMLElement>(testId);
    expect(element).withContext(`elemento [data-testid="${testId}"]`).not.toBeNull();
    return (element!.textContent ?? '').replace(/\u00A0/g, ' ');
  }

  function render(activeProject: Project | null): void {
    if (activeProject) {
      activeProjectService.setActiveProject(activeProject, 'user-1');
    } else {
      activeProjectService.clear();
    }
    fixture.detectChanges();
  }

  /** Preenche um campo nativo como o usuario faria, disparando os value accessors. */
  function setField(testId: string, value: string): void {
    const element = query<HTMLInputElement | HTMLSelectElement>(testId);
    expect(element).withContext(`elemento [data-testid="${testId}"]`).not.toBeNull();
    element!.value = value;
    element!.dispatchEvent(new Event('input'));
    element!.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    budgetService = jasmine.createSpyObj<BudgetService>('BudgetService', [
      'getOverview',
      'setBudget',
    ]);
    categoryService = jasmine.createSpyObj<CategoryService>('CategoryService', ['getCategories']);
    budgetService.getOverview.and.returnValue(of(overview));
    budgetService.setBudget.and.returnValue(of(
      category({
        categoryId: 'cat-hidraulica',
        categoryName: 'Hidráulica',
        plannedAmount: 900,
        spentAmount: 300,
        balanceAmount: 600,
        percentage: 33.3,
        state: 'ON_TRACK',
      }),
    ));
    categoryService.getCategories.and.returnValue(of(categories));

    await TestBed.configureTestingModule({
      imports: [BudgetsPageComponent],
      providers: [
        { provide: BudgetService, useValue: budgetService },
        { provide: CategoryService, useValue: categoryService },
        provideRouter([]),
      ],
    }).compileComponents();

    activeProjectService = TestBed.inject(ActiveProjectService);
    fixture = TestBed.createComponent(BudgetsPageComponent);
    component = fixture.componentInstance;
  });

  it('shows formatted KPIs including the global percentage', () => {
    render(project);

    expect(budgetService.getOverview).toHaveBeenCalledOnceWith(project.id);
    expect(categoryService.getCategories).toHaveBeenCalledTimes(1);
    expect(text('kpi-total-planned')).toContain('R$ 15.000,00');
    expect(text('kpi-total-spent')).toContain('R$ 8.500,00');
    expect(text('kpi-total-spent')).toContain('56,7%');
    expect(text('kpi-available')).toContain('R$ 6.500,00');
    expect(text('kpi-exceeded')).toContain('1 de 3');
  });

  it('renders each category row with the bar capped at 100% and the real percentage', () => {
    render(project);

    const exceeded = query<HTMLElement>('budget-row-cat-alvenaria');
    expect(exceeded).not.toBeNull();
    const exceededBar = exceeded!.querySelector<HTMLElement>('[data-testid="category-bar"]');
    expect(exceededBar).not.toBeNull();
    expect(exceededBar!.style.width).toBe('100%');
    expect(exceededBar!.classList).toContain('bg-rose-500');
    expect(exceeded!.querySelector('[data-testid="category-percentage"]')?.textContent)
      .toContain('112,5%');
    expect(exceeded!.querySelector('[data-testid="category-state"]')?.textContent)
      .toContain('Estourado');

    const warning = query<HTMLElement>('budget-row-cat-eletrica');
    expect(warning).not.toBeNull();
    const warningBar = warning!.querySelector<HTMLElement>('[data-testid="category-bar"]');
    expect(warningBar!.style.width).toBe('90%');
    expect(warningBar!.classList).toContain('bg-amber-500');
    expect(warning!.querySelector('[data-testid="category-state"]')?.textContent)
      .toContain('Atenção');

    const onTrack = query<HTMLElement>('budget-row-cat-mao-de-obra');
    expect(onTrack).not.toBeNull();
    expect(onTrack!.querySelector('[data-testid="category-state"]')?.textContent)
      .toContain('Dentro do orçamento');

    const withoutBudget = query<HTMLElement>('budget-row-cat-hidraulica');
    expect(withoutBudget).not.toBeNull();
    expect(withoutBudget!.querySelector('[data-testid="category-percentage"]')?.textContent)
      .toContain('—');
    expect(withoutBudget!.querySelector('[data-testid="category-state"]')?.textContent)
      .toContain('Sem orçamento');
  });

  it('shows the onboarding state with zeroed KPIs and the first-budget CTA', () => {
    budgetService.getOverview.and.returnValue(of({
      projectId: project.id,
      totalPlanned: 0,
      totalSpent: 0,
      available: 0,
      globalPercentage: null,
      exceededCategories: 0,
      budgetedCategories: 0,
      categories: [],
    }));

    render(project);

    expect(text('kpi-total-planned')).toContain('R$ 0,00');
    expect(text('kpi-total-spent')).toContain('R$ 0,00');
    expect(text('kpi-total-spent')).toContain('—');
    expect(text('kpi-available')).toContain('R$ 0,00');
    const emptyState = query<HTMLElement>('budgets-empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain(
      'Defina o primeiro orçamento para começar a acompanhar categorias, gastos e saldo.',
    );
    expect(query('define-first-budget')?.textContent).toContain('Definir primeiro orçamento');
  });

  it('does not show the onboarding when there are expenses without a ceiling', () => {
    budgetService.getOverview.and.returnValue(of({
      projectId: project.id,
      totalPlanned: 0,
      totalSpent: 300,
      available: -300,
      globalPercentage: null,
      exceededCategories: 0,
      budgetedCategories: 0,
      categories: [
        category({
          categoryId: 'cat-hidraulica',
          categoryName: 'Hidráulica',
          spentAmount: 300,
          balanceAmount: -300,
          hasBudget: false,
        }),
      ],
    }));

    render(project);

    expect(query('budgets-empty-state')).toBeNull();
    expect(query('budget-row-cat-hidraulica')).not.toBeNull();
    expect(text('kpi-total-spent')).toContain('—');
  });

  it('shows guidance and does not call the budget API when there is no active project', () => {
    render(null);

    expect(budgetService.getOverview).not.toHaveBeenCalled();
    expect(categoryService.getCategories).not.toHaveBeenCalled();
    const emptyState = query<HTMLElement>('budgets-no-project-empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('Selecione ou cadastre uma obra');
    const homeLink = query<HTMLAnchorElement>('budgets-go-home');
    expect(homeLink).not.toBeNull();
    expect(homeLink!.getAttribute('href')).toBe('/home');
  });

  it('shows a load error and retries when the owner asks', () => {
    budgetService.getOverview.and.returnValue(throwError(() => new Error('network')));

    render(project);

    const error = query<HTMLElement>('budgets-load-error');
    expect(error).not.toBeNull();
    expect(error!.textContent).toContain('Não foi possível carregar os orçamentos');
    const retryButton = error!.querySelector<HTMLButtonElement>('button');
    expect(retryButton).not.toBeNull();
    expect(retryButton!.textContent).toContain('Tentar novamente');

    budgetService.getOverview.and.returnValue(of(overview));
    retryButton!.click();
    fixture.detectChanges();

    expect(budgetService.getOverview.calls.count()).toBe(2);
    expect(query('budgets-load-error')).toBeNull();
    expect(text('kpi-total-planned')).toContain('R$ 15.000,00');
    expect(component.overview()?.projectId).toBe(project.id);
  });

  it('creates a budget from "Adicionar orçamento" and reloads the panel after saving', () => {
    render(project);
    expect(query('budget-form-modal')).toBeNull();

    query<HTMLButtonElement>('add-budget')!.click();
    fixture.detectChanges();

    expect(query('budget-form-modal')).not.toBeNull();
    expect(query<HTMLSelectElement>('budget-form-category')!.value).toBe('');

    setField('budget-form-category', 'cat-hidraulica');
    setField('budget-form-amount', '900');
    query<HTMLButtonElement>('budget-form-submit')!.click();
    fixture.detectChanges();

    expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
      project.id,
      'cat-hidraulica',
      { estimatedAmount: 900 },
    );
    expect(budgetService.getOverview.calls.count()).toBe(2);
    expect(query('budget-form-modal')).toBeNull();
  });

  it('opens the edit form with the row category locked and the current amount', () => {
    render(project);

    query<HTMLButtonElement>('edit-budget-cat-alvenaria')!.click();
    fixture.detectChanges();

    expect(query('budget-form-modal')).not.toBeNull();
    const select = query<HTMLSelectElement>('budget-form-category');
    expect(select).not.toBeNull();
    expect(select!.disabled).toBeTrue();
    expect(select!.value).toBe('cat-alvenaria');
    expect(query<HTMLInputElement>('budget-form-amount')!.value).toBe('1000');

    setField('budget-form-amount', '1800');
    query<HTMLButtonElement>('budget-form-submit')!.click();
    fixture.detectChanges();

    expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
      project.id,
      'cat-alvenaria',
      { estimatedAmount: 1800 },
    );
    expect(budgetService.getOverview.calls.count()).toBe(2);
    expect(query('budget-form-modal')).toBeNull();
  });

  it('opens the form already on the category when the row offers "Definir teto"', () => {
    render(project);

    query<HTMLButtonElement>('define-ceiling-cat-hidraulica')!.click();
    fixture.detectChanges();

    const select = query<HTMLSelectElement>('budget-form-category');
    expect(select).not.toBeNull();
    expect(select!.disabled).toBeFalse();
    expect(select!.value).toBe('cat-hidraulica');

    setField('budget-form-amount', '900');
    query<HTMLButtonElement>('budget-form-submit')!.click();
    fixture.detectChanges();

    expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
      project.id,
      'cat-hidraulica',
      { estimatedAmount: 900 },
    );
    expect(budgetService.getOverview.calls.count()).toBe(2);
    expect(query('budget-form-modal')).toBeNull();
  });

  it('opens the form from the onboarding CTA', () => {
    budgetService.getOverview.and.returnValue(of({
      projectId: project.id,
      totalPlanned: 0,
      totalSpent: 0,
      available: 0,
      globalPercentage: null,
      exceededCategories: 0,
      budgetedCategories: 0,
      categories: [],
    }));
    render(project);

    query<HTMLButtonElement>('define-first-budget')!.click();
    fixture.detectChanges();

    expect(query('budget-form-modal')).not.toBeNull();
    const options = query<HTMLSelectElement>('budget-form-category')!.options;
    expect(options.length).toBe(categories.length + 1);
  });

  it('closes the form without calling the API when the owner cancels', () => {
    render(project);

    query<HTMLButtonElement>('add-budget')!.click();
    fixture.detectChanges();
    query<HTMLButtonElement>('budget-form-cancel')!.click();
    fixture.detectChanges();

    expect(query('budget-form-modal')).toBeNull();
    expect(budgetService.setBudget).not.toHaveBeenCalled();
    expect(budgetService.getOverview.calls.count()).toBe(1);
  });
});
