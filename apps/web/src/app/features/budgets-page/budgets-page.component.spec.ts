import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { BudgetService } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetCategory, BudgetOverview } from '../../core/models/budget.model';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { Project, ProjectStatus, ProjectType } from '../../core/models/project.model';
import { BudgetsPageComponent } from './budgets-page.component';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { Auth } from '../../core/services/auth';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ProjectService } from '../../core/services/project.service';
import { AuthenticatedIdentityService } from '../../core/services/authenticated-identity.service';

describe('BudgetsPageComponent', () => {
  let fixture: ComponentFixture<BudgetsPageComponent>;
  let component: BudgetsPageComponent;
  let activeProjectService: ActiveProjectService;
  let budgetService: jasmine.SpyObj<BudgetService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let projectService: jasmine.SpyObj<ProjectService>;

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

  const zeroedCategory: BudgetCategory = category({
    categoryId: 'cat-alvenaria',
    categoryName: 'Alvenaria',
    plannedAmount: 0,
    spentAmount: 1125,
    balanceAmount: -1125,
    percentage: null,
    state: 'NO_BUDGET',
  });

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
    element!.value = testId === 'budget-form-amount' ? value + '00' : value;
    element!.dispatchEvent(new Event('input'));
    element!.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    budgetService = jasmine.createSpyObj<BudgetService>('BudgetService', [
      'getOverview',
      'getSinapiReferences',
      'setBudget',
      'zeroBudget',
    ]);
    categoryService = jasmine.createSpyObj<CategoryService>('CategoryService', ['getCategories']);
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', ['getProjects']);
    projectService.getProjects.and.callFake(() => of([{ ...project }]));
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
    budgetService.zeroBudget.and.returnValue(of(zeroedCategory));

    await TestBed.configureTestingModule({
      imports: [BudgetsPageComponent, NavbarComponent],
      providers: [
        { provide: BudgetService, useValue: budgetService },
        { provide: CategoryService, useValue: categoryService },
        { provide: ProjectService, useValue: projectService },
        { provide: AuthenticatedIdentityService, useValue: { getUserId: () => 'user-1' } },
        provideHttpClient(),
        provideRouter([]),
      ],
    }).compileComponents();

    activeProjectService = TestBed.inject(ActiveProjectService);
    fixture = TestBed.createComponent(BudgetsPageComponent);
    component = fixture.componentInstance;
  });

  for (const dialog of ['form', 'zero']) {
    it(`keeps the panel and ${dialog} draft when the navbar refreshes or selects the same project`, () => {
      const navbar = TestBed.createComponent(NavbarComponent);
      navbar.detectChanges();
      fixture.detectChanges();
      if (dialog === 'form') {
        component.openBudgetForm();
        fixture.detectChanges();
        setField('budget-form-amount', '1900');
      } else component.openZeroConfirm(overview.categories[0]);
      fixture.detectChanges();
      const row = query('budget-row-cat-alvenaria');
      // A spurious reload stays pending so the test also detects a loading flash.
      budgetService.getOverview.and.returnValue(new Subject<BudgetOverview>());
      const renamed = { ...project, name: 'Obra renomeada', status: ProjectStatus.PAUSED };
      projectService.getProjects.and.callFake(() => of([{ ...renamed }]));

      navbar.componentInstance.toggleDeskDropdown();
      navbar.detectChanges();
      fixture.detectChanges();
      expect(projectService.getProjects.calls.count()).toBe(2);
      expect(budgetService.getOverview).toHaveBeenCalledOnceWith(project.id);
      expect(categoryService.getCategories).toHaveBeenCalledTimes(1);
      expect(query('budgets-loading')).toBeNull();
      expect(query('budget-row-cat-alvenaria')).toBe(row);
      expect(page().textContent).toContain(renamed.name);
      expect(activeProjectService.activeProject()?.status).toBe(ProjectStatus.PAUSED);
      expect(query(dialog === 'form' ? 'budget-form-modal' : 'confirm-confirmation')).not.toBeNull();
      if (dialog === 'form') expect(query<HTMLInputElement>('budget-form-amount')?.value.replace(/\s/g, ' ')).toBe('R$ 1.900,00');

      navbar.componentInstance.selectProject({ ...renamed });
      fixture.detectChanges();
      expect(budgetService.getOverview).toHaveBeenCalledTimes(1);
      expect(categoryService.getCategories).toHaveBeenCalledTimes(1);
      expect(query(dialog === 'form' ? 'budget-form-modal' : 'confirm-confirmation')).not.toBeNull();
      if (dialog === 'form') expect(query<HTMLInputElement>('budget-form-amount')?.value.replace(/\s/g, ' ')).toBe('R$ 1.900,00');
    });
  }

  it('reloads once on a real navbar project switch and clears the panel when no projects remain', () => {
    const navbar = TestBed.createComponent(NavbarComponent);
    navbar.detectChanges();
    fixture.detectChanges();
    component.openBudgetForm();
    component.openZeroConfirm(overview.categories[0]);
    fixture.detectChanges();
    const nextProject = { ...project, id: 'project-2' };
    budgetService.getOverview.and.returnValue(of({ ...overview, projectId: nextProject.id }));

    navbar.componentInstance.selectProject(nextProject);
    fixture.detectChanges();
    expect(budgetService.getOverview.calls.allArgs()).toEqual([[project.id], [nextProject.id]]);
    expect(categoryService.getCategories).toHaveBeenCalledTimes(2);
    expect(query('budget-form-modal')).toBeNull();
    expect(query('confirm-confirmation')).toBeNull();
    expect(component.overview()?.projectId).toBe(nextProject.id);

    projectService.getProjects.and.returnValue(of([]));
    navbar.componentInstance.toggleDeskDropdown();
    fixture.detectChanges();
    expect(query('budgets-no-project-empty-state')).not.toBeNull();
    expect(component.overview()).toBeNull();
    expect(component.categories()).toEqual([]);
    expect(component.loading()).toBeFalse();
    expect(budgetService.getOverview).toHaveBeenCalledTimes(2);
    expect(categoryService.getCategories).toHaveBeenCalledTimes(2);
  });

  for (const dialog of ['form', 'zero']) {
    it(`closes the ${dialog} on project switch and discards unsent data`, () => {
      render(project);
      if (dialog === 'form') {
        component.openBudgetForm();
        fixture.detectChanges();
        setField('budget-form-amount', '1900');
      } else component.openZeroConfirm(overview.categories[0]);
      fixture.detectChanges();
      const nextProject = { ...project, id: 'project-2' };
      budgetService.getOverview.and.returnValue(of({ ...overview, projectId: nextProject.id }));
      render(nextProject);
      expect(query('budget-form-modal')).toBeNull();
      expect(query('confirm-confirmation')).toBeNull();
      expect(budgetService.getOverview).toHaveBeenCalledWith(nextProject.id);
      expect(component.overview()?.projectId).toBe(nextProject.id);
      expect(budgetService.setBudget).not.toHaveBeenCalled();
      expect(budgetService.zeroBudget).not.toHaveBeenCalled();
      component.openBudgetForm();
      fixture.detectChanges();
      expect(query<HTMLInputElement>('budget-form-amount')!.value).toBe('');
    });
  }

  it('ignores a late overview after changing project', () => {
    const pending = new Subject<BudgetOverview>();
    budgetService.getOverview.and.returnValue(pending);
    render(project);
    const nextProject = { ...project, id: 'project-2' };
    budgetService.getOverview.and.returnValue(of({ ...overview, projectId: nextProject.id }));
    render(nextProject);
    pending.next(overview);
    pending.complete();
    expect(component.overview()?.projectId).toBe(nextProject.id);
  });

  for (const operation of ['save', 'zero']) {
    for (const response of ['success', 'error']) {
      it(`ignores late ${operation} ${response} after A to B to A without closing a new dialog`, () => {
        const pending = new Subject<BudgetCategory>();
        render(project);
        if (operation === 'save') {
          budgetService.setBudget.and.returnValue(pending);
          component.openBudgetForm(overview.categories[0]);
          fixture.detectChanges();
          query<HTMLButtonElement>('budget-form-submit')!.click();
        } else {
          budgetService.zeroBudget.and.returnValue(pending);
          component.openZeroConfirm(overview.categories[0]);
          fixture.detectChanges();
          query<HTMLButtonElement>('confirm-confirmation')!.click();
        }
        fixture.detectChanges();
        render({ ...project, id: 'project-2' });
        render(project);
        if (operation === 'save') component.openBudgetForm(overview.categories[1]);
        else component.openZeroConfirm(overview.categories[1]);
        fixture.detectChanges();
        const reads = budgetService.getOverview.calls.count();
        if (response === 'success') pending.next(zeroedCategory);
        else pending.error(new HttpErrorResponse({ status: 409, error: { message: 'old error' } }));
        fixture.detectChanges();
        expect(budgetService.getOverview.calls.count()).toBe(reads);
        if (operation === 'save') {
          expect(query('budget-form-modal')).not.toBeNull();
          expect(query<HTMLSelectElement>('budget-form-category')!.value).toBe('cat-eletrica');
          expect(query('budget-form-error')).toBeNull();
        } else {
          expect(query('confirm-confirmation')).not.toBeNull();
          expect(component.zeroTarget()?.categoryId).toBe('cat-eletrica');
        }
      });
    }
  }

  for (const operation of ['save', 'zero']) {
    it(`disables ${operation} during the request and makes only one call`, () => {
      render(project);
      const pending = new Subject<BudgetCategory>();
      if (operation === 'save') {
        budgetService.setBudget.and.returnValue(pending);
        component.openBudgetForm(overview.categories[0]);
      } else {
        budgetService.zeroBudget.and.returnValue(pending);
        component.openZeroConfirm(overview.categories[0]);
      }
      fixture.detectChanges();
      const button = query<HTMLButtonElement>(operation === 'save' ? 'budget-form-submit' : 'confirm-confirmation')!;
      button.click();
      fixture.detectChanges();
      expect(button.disabled).toBeTrue();
      button.click();
      if (operation === 'zero') component.confirmZero();
      expect(operation === 'save' ? budgetService.setBudget : budgetService.zeroBudget).toHaveBeenCalledTimes(1);
      pending.next(zeroedCategory);
      fixture.detectChanges();
      expect(query(operation === 'save' ? 'budget-form-modal' : 'confirm-confirmation')).toBeNull();
    });
  }

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

  it('shows the full SINAPI rateio while the standard form filters categories with a ceiling', fakeAsync(() => {
    budgetService.getSinapiReferences.and.returnValue(of({
      source: 'SIDRA/IBGE',
      finishes: [{ id: '787', name: 'Normal', unitCost: 2221.06 }],
    }));
    render(project);
    query<HTMLButtonElement>('add-budget')!.click();
    fixture.detectChanges();
    const standardOptions = query<HTMLSelectElement>('budget-form-category')!.options;
    expect(Array.from(standardOptions, option => option.value)).toEqual(['', 'cat-hidraulica']);

    query<HTMLButtonElement>('budget-form-sinapi')!.click();
    fixture.detectChanges();
    function change(testId: string, value: string, event: string): void {
      const field = query<HTMLInputElement | HTMLSelectElement>(testId)!;
      field.value = value;
      field.dispatchEvent(new Event(event));
      fixture.detectChanges();
    }

    change('sinapi-area', '100', 'input');
    change('sinapi-state', 'PR', 'change');
    change('sinapi-month', '2026-09', 'input');
    change('sinapi-project', '7101', 'change');
    change('sinapi-finish', '787', 'change');

    for (const item of categories) {
      expect(query(`sinapi-percent-${item.id}`)).not.toBeNull();
    }
    expect(query<HTMLInputElement>('sinapi-percent-cat-alvenaria')?.value).toBe('14');
  }));

  it('opens the edit form with the row category locked and the current amount', () => {
    render(project);

    query<HTMLButtonElement>('edit-budget-cat-alvenaria')!.click();
    fixture.detectChanges();

    expect(query('budget-form-modal')).not.toBeNull();
    const select = query<HTMLSelectElement>('budget-form-category');
    expect(select).not.toBeNull();
    expect(select!.disabled).toBeTrue();
    expect(select!.value).toBe('cat-alvenaria');
    expect(query<HTMLInputElement>('budget-form-amount')!.value.replace(/\s/g, ' ')).toBe('R$ 1.000,00');

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

  it('offers "Zerar" only for budgeted categories with a positive amount and opens the confirmation', () => {
    render(project);

    expect(query('zero-budget-cat-alvenaria')).not.toBeNull();
    expect(query('zero-budget-cat-eletrica')).not.toBeNull();
    expect(query('zero-budget-cat-mao-de-obra')).not.toBeNull();
    expect(query('zero-budget-cat-hidraulica')).toBeNull();
    expect(query('confirm-confirmation')).toBeNull();

    query<HTMLButtonElement>('zero-budget-cat-alvenaria')!.click();
    fixture.detectChanges();

    expect(query('confirm-confirmation')).not.toBeNull();
    expect(text('confirm-modal-content')).toContain('Alvenaria');
    expect(budgetService.zeroBudget).not.toHaveBeenCalled();
  });

  it('hides "Zerar" but keeps "Editar" for a zeroed category that still has a record', () => {
    budgetService.getOverview.and.returnValue(of({
      projectId: project.id,
      totalPlanned: 1000,
      totalSpent: 1425,
      available: -425,
      globalPercentage: null,
      exceededCategories: 0,
      budgetedCategories: 1,
      categories: [
        category({
          categoryId: 'cat-alvenaria',
          categoryName: 'Alvenaria',
          plannedAmount: 0,
          spentAmount: 1125,
          balanceAmount: -1125,
          percentage: null,
          state: 'NO_BUDGET',
          hasBudget: true,
        }),
        category({
          categoryId: 'cat-eletrica',
          categoryName: 'Elétrica',
          plannedAmount: 1000,
          spentAmount: 300,
          balanceAmount: 700,
          percentage: 30,
          state: 'ON_TRACK',
          hasBudget: true,
        }),
      ],
    }));

    render(project);

    expect(query('budget-row-cat-alvenaria')).not.toBeNull();
    expect(query('edit-budget-cat-alvenaria')).not.toBeNull();
    expect(query('zero-budget-cat-alvenaria')).toBeNull();
    expect(query('define-ceiling-cat-alvenaria')).not.toBeNull();

    expect(query('edit-budget-cat-eletrica')).not.toBeNull();
    expect(query('zero-budget-cat-eletrica')).not.toBeNull();
    expect(query('define-ceiling-cat-eletrica')).toBeNull();
  });

  it('zeroes the budget after confirmation and reloads the panel', () => {
    render(project);

    query<HTMLButtonElement>('zero-budget-cat-alvenaria')!.click();
    fixture.detectChanges();
    query<HTMLButtonElement>('confirm-confirmation')!.click();
    fixture.detectChanges();

    expect(budgetService.zeroBudget).toHaveBeenCalledOnceWith(project.id, 'cat-alvenaria');
    expect(budgetService.getOverview.calls.count()).toBe(2);
    expect(query('confirm-confirmation')).toBeNull();
  });

  for (const hasBudget of [true, false]) {
    it(`audits expenses without a ceiling and opens the category form (hasBudget=${hasBudget})`, () => {
      const row = { ...zeroedCategory, hasBudget };
      budgetService.getOverview.and.returnValue(of({ ...overview, categories: [row] }));
      render(project);

      const alert = query<HTMLElement>('budget-audit-cat-alvenaria');
      expect(alert).not.toBeNull();
      expect(alert?.textContent?.trim()).toBe(
        'Há despesas nesta categoria sem orçamento definido. Defina um teto ou reclassifique a despesa.',
      );
      expect(query('budget-row-cat-alvenaria')?.contains(alert!)).toBeTrue();
      const reclassify = query<HTMLButtonElement>('reclassify-expense-cat-alvenaria');
      expect(reclassify).not.toBeNull();
      expect(reclassify?.textContent?.trim()).toBe('Reclassificar despesa');
      expect(reclassify?.disabled).toBeTrue();
      expect(reclassify?.title).toBe(
        'Disponível após a implementação da tela de despesas (US04/US05)',
      );

      const define = query<HTMLButtonElement>('define-ceiling-cat-alvenaria');
      expect(define).not.toBeNull();
      expect(define?.disabled).toBeFalse();
      define?.click();
      fixture.detectChanges();

      const select = query<HTMLSelectElement>('budget-form-category');
      expect(select?.value).toBe('cat-alvenaria');
      expect(select?.disabled).toBe(hasBudget);
      setField('budget-form-amount', '1500');
      query<HTMLButtonElement>('budget-form-submit')!.click();
      fixture.detectChanges();
      expect(budgetService.setBudget).toHaveBeenCalledOnceWith(
        project.id, 'cat-alvenaria', { estimatedAmount: 1500 },
      );
    });
  }

  it('does not audit a zeroed category without expenses or expenses within a ceiling', () => {
    budgetService.getOverview.and.returnValue(of({
      ...overview,
      categories: [
        { ...zeroedCategory, spentAmount: 0, balanceAmount: 0 },
        overview.categories[1],
      ],
    }));
    render(project);

    expect(query('budget-audit-cat-alvenaria')).toBeNull();
    expect(query('reclassify-expense-cat-alvenaria')).toBeNull();
    expect(query('budget-audit-cat-eletrica')).toBeNull();
    expect(query('reclassify-expense-cat-eletrica')).toBeNull();
  });

  it('closes the zero confirmation without calling the API when the owner cancels', () => {
    render(project);

    query<HTMLButtonElement>('zero-budget-cat-alvenaria')!.click();
    fixture.detectChanges();
    query<HTMLButtonElement>('cancel-confirmation')!.click();
    fixture.detectChanges();

    expect(query('confirm-confirmation')).toBeNull();
    expect(budgetService.zeroBudget).not.toHaveBeenCalled();
    expect(budgetService.getOverview.calls.count()).toBe(1);
  });

  it('closes the zero confirmation without calling the API on Escape', () => {
    render(project);

    query<HTMLButtonElement>('zero-budget-cat-alvenaria')!.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(query('confirm-confirmation')).toBeNull();
    expect(budgetService.zeroBudget).not.toHaveBeenCalled();
    expect(budgetService.getOverview.calls.count()).toBe(1);
  });

  it('offers the disabled expense shortcut with the US05 title after a conflict', () => {
    const message = 'O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ 1.125,00';
    budgetService.setBudget.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { message },
    })));
    render(project);
    query<HTMLButtonElement>('edit-budget-cat-alvenaria')!.click();
    fixture.detectChanges();
    expect(query('budget-form-view-expenses')).toBeNull();
    setField('budget-form-amount', '1100');
    query<HTMLButtonElement>('budget-form-submit')!.click();
    fixture.detectChanges();

    const shortcut = query<HTMLButtonElement>('budget-form-view-expenses');
    expect(shortcut).not.toBeNull();
    expect(shortcut!.disabled).toBeTrue();
    expect(shortcut!.textContent).toContain('Ver despesas desta categoria');
    expect(shortcut!.title).toBe('Disponível após a implementação da tela de despesas (US05)');
    expect(text('budget-form-error')).toContain(message);
    expect(query('budget-form-modal')).not.toBeNull();
    expect(query<HTMLInputElement>('budget-form-amount')!.value.replace(/\s/g, ' ')).toBe('R$ 1.100,00');
    expect(budgetService.getOverview.calls.count()).toBe(1);
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

describe('BudgetsPageComponent connection recovery through HTTP', () => {
  let fixture: ComponentFixture<BudgetsPageComponent>;
  let http: HttpTestingController;
  const project: Project = {
    id: 'project-connection', name: 'Obra', type: ProjectType.RENOVATION,
    status: ProjectStatus.IN_PROGRESS, location: '', createdAt: '', updatedAt: '',
  };
  const category: BudgetCategory = {
    categoryId: 'category-connection', categoryName: 'Alvenaria', plannedAmount: 1000,
    spentAmount: 200, balanceAmount: 800, percentage: 20, state: 'ON_TRACK', hasBudget: true,
  };
  const overview: BudgetOverview = {
    projectId: project.id, totalPlanned: 1000, totalSpent: 200, available: 800,
    globalPercentage: 20, exceededCategories: 0, budgetedCategories: 1, categories: [category],
  };
  function query<T extends HTMLElement>(id: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(`[data-testid="${id}"]`);
  }
  function loadSuccessfully(): void {
    http.expectOne(request => request.url.endsWith('/api/budgets')).flush(overview);
    http.expectOne(request => request.url.endsWith('/api/expense-categories'))
      .flush([{ id: category.categoryId, name: category.categoryName }]);
    fixture.detectChanges();
  }
  function failRequest(request: TestRequest, failure: string): void {
    if (failure === 'server') request.flush({ message: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    else request.error(new ProgressEvent(failure));
    fixture.detectChanges();
  }
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BudgetsPageComponent],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(ActiveProjectService).setActiveProject(project, 'user-connection');
    fixture = TestBed.createComponent(BudgetsPageComponent);
    fixture.detectChanges();
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  for (const failure of ['error', 'timeout', 'server']) {
    it(`shows the load AlertBanner and recovers after ${failure}`, () => {
      const read = http.expectOne(request => request.url.endsWith('/api/budgets'));
      http.expectOne(request => request.url.endsWith('/api/expense-categories')).flush([]);
      failRequest(read, failure);
      const alert = query('budgets-load-error')!;
      expect(alert.querySelector('app-alert-banner')).not.toBeNull();
      expect(alert.textContent).toContain('Verifique sua conexão');
      alert.querySelector<HTMLButtonElement>('button')!.click();
      fixture.detectChanges();
      loadSuccessfully();
      expect(query('budgets-load-error')).toBeNull();
      expect(fixture.componentInstance.overview()).toEqual(overview);
    });

    it(`preserves the form and typed value, then retries after save ${failure}`, () => {
      loadSuccessfully();
      query<HTMLButtonElement>('edit-budget-' + category.categoryId)!.click();
      fixture.detectChanges();
      const input = query<HTMLInputElement>('budget-form-amount')!;
      input.value = '180000';
      input.dispatchEvent(new Event('input'));
      query<HTMLButtonElement>('budget-form-submit')!.click();
      failRequest(http.expectOne(request => request.method === 'PUT'), failure);
      expect(query('budget-form-modal')).not.toBeNull();
      expect(query<HTMLInputElement>('budget-form-amount')!.value.replace(/\s/g, ' ')).toBe('R$ 1.800,00');
      expect(query<HTMLSelectElement>('budget-form-category')!.value).toBe(category.categoryId);
      expect(query('budget-form-error')!.textContent).toContain('Verifique sua conexão');
      expect(query<HTMLButtonElement>('budget-form-submit')!.disabled).toBeFalse();
      expect(fixture.componentInstance.overview()).toEqual(overview);
      query<HTMLButtonElement>('budget-form-submit')!.click();
      const retry = http.expectOne(request => request.method === 'PUT');
      expect(retry.request.body).toEqual({ estimatedAmount: 1800 });
      fixture.detectChanges();
      expect(query('budget-form-error')).toBeNull();
      retry.flush({ ...category, plannedAmount: 1800 });
      loadSuccessfully();
      expect(query('budget-form-modal')).toBeNull();
    });

    it(`keeps the zero dialog with visible feedback and retries after ${failure}`, () => {
      loadSuccessfully();
      query<HTMLButtonElement>('zero-budget-' + category.categoryId)!.click();
      fixture.detectChanges();
      query<HTMLButtonElement>('confirm-confirmation')!.click();
      failRequest(http.expectOne(request => request.method === 'POST'), failure);
      expect(query('confirm-modal-content')).not.toBeNull();
      expect(query<HTMLButtonElement>('confirm-confirmation')!.disabled).toBeFalse();
      expect(fixture.componentInstance.overview()).toEqual(overview);
      const alert = query('budget-zero-error');
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain('Verifique sua conexão');
      expect(alert?.classList).toContain('z-[60]');
      alert?.querySelector<HTMLButtonElement>('button')!.click();
      const retry = http.expectOne(request => request.method === 'POST');
      fixture.detectChanges();
      expect(query('budget-zero-error')).toBeNull();
      retry.flush({ ...category, plannedAmount: 0 });
      loadSuccessfully();
      expect(query('confirm-modal-content')).toBeNull();
      expect(query('budget-zero-error')).toBeNull();
    });
  }

  for (const operation of ['read', 'save', 'zero']) {
    it(`clears the real session and navigates to /login after ${operation} returns 401`, () => {
      const auth = TestBed.inject(Auth);
      const token = `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify({ sub: 'user-connection', exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
      auth.saveToken(token);
      expect(auth.isAuthenticated()).toBeTrue();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      let request: TestRequest;
      if (operation === 'read') {
        // The initial requests predate login in this fixture. Retry through the interceptor with the stored token.
        loadSuccessfully();
        fixture.componentInstance.retry();
        http.expectOne(candidate => candidate.url.endsWith('/api/expense-categories')).flush([]);
        request = http.expectOne(candidate => candidate.url.endsWith('/api/budgets'));
      } else {
        loadSuccessfully();
        if (operation === 'save') fixture.componentInstance.openBudgetForm(category);
        else fixture.componentInstance.openZeroConfirm(category);
        fixture.detectChanges();
        query<HTMLButtonElement>(operation === 'save' ? 'budget-form-submit' : 'confirm-confirmation')!.click();
        request = http.expectOne(candidate => candidate.method === (operation === 'save' ? 'PUT' : 'POST'));
      }
      expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      request.flush({ message: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });
      fixture.detectChanges();
      expect(auth.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(auth.isAuthenticated()).toBeFalse();
      expect(TestBed.inject(ActiveProjectService).activeProject()).toBeNull();
      expect(navigate).toHaveBeenCalledOnceWith(['/login']);
      expect(query('budget-form-modal')).toBeNull();
      expect(query('confirm-modal-content')).toBeNull();
      expect(fixture.componentInstance.overview()).toBeNull();
    });
  }
});
