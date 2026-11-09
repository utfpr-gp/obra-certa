import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { Project, ProjectStatus, ProjectType } from '../../core/models/project.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthenticatedIdentityService } from '../../core/services/authenticated-identity.service';
import { ProjectModalComponent } from '../../shared/components/project-modal/project-modal.component';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetCategory, BudgetOverview } from '../../core/models/budget.model';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentAlerts } from '../../core/models/payment.model';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let activeProjectService: ActiveProjectService;
  let activeProjectState: (() => Project | null) & {
    set: (project: Project | null) => void;
  };
  let projectService: jasmine.SpyObj<ProjectService>;
  let budgetService: jasmine.SpyObj<BudgetService>;
  let overviewRequests: { projectId: string; response: Subject<BudgetOverview> }[];
  let paymentService: jasmine.SpyObj<PaymentService>;
  let alerts: Subject<PaymentAlerts>;

  const activeProject: Project = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Obra ativa global',
    type: ProjectType.RENOVATION,
    location: 'Rua global',
    status: ProjectStatus.IN_PROGRESS,
    createdAt: '',
    updatedAt: '',
  };
  const anotherProject: Project = {
    id: '7f8c0a6d-2b4e-4e6e-9f4c-1d9a2a4b5c6d',
    name: 'Segunda obra',
    type: ProjectType.NEW_CONSTRUCTION,
    location: 'Rua secundária',
    status: ProjectStatus.IN_PROGRESS,
    createdAt: '',
    updatedAt: '',
  };

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function query<T extends Element>(testId: string): T | null {
    return page().querySelector<T>(`[data-testid="${testId}"]`);
  }

  function click(testId: string): void {
    const element = query<HTMLElement>(testId);
    expect(element).withContext(`elemento [data-testid="${testId}"]`).not.toBeNull();
    element!.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    alerts = new Subject<PaymentAlerts>();
    paymentService = jasmine.createSpyObj<PaymentService>('PaymentService', ['getAlerts', 'requiresReconciliation']);
    paymentService.requiresReconciliation.and.returnValue(false);
    paymentService.getAlerts.and.returnValue(alerts);
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', [
      'getProjects',
      'deleteProject',
    ]);
    projectService.getProjects.and.returnValue(of([activeProject]));
    projectService.deleteProject.and.returnValue(of(undefined));
    overviewRequests = [];
    budgetService = jasmine.createSpyObj<BudgetService>('BudgetService', ['getOverview']);
    budgetService.getOverview.and.callFake((projectId: string) => {
      const response = new Subject<BudgetOverview>();
      overviewRequests.push({ projectId, response });
      return response.asObservable();
    });
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: ProjectService, useValue: projectService },
        { provide: BudgetService, useValue: budgetService },
        { provide: PaymentService, useValue: paymentService },
        {
          provide: AuthenticatedIdentityService,
          useValue: { getUserId: () => 'user-1' },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    activeProjectService = TestBed.inject(ActiveProjectService);
    activeProjectService.setActiveProject(activeProject, 'user-1');
    activeProjectState = Object.assign(
      () => activeProjectService.activeProject(),
      {
        set: (project: Project | null) =>
          activeProjectService.setActiveProject(project, 'user-1'),
      },
    );
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the home page', () => {
    expect(component).toBeTruthy();
  });

  it('offers the payment action only on pending alert rows and opens the shared modal', () => {
    alerts.next(response()); fixture.detectChanges();
    const actions = page().querySelectorAll<HTMLButtonElement>('[data-testid="mark-payment-paid"]');
    expect(actions.length).toBe(3);
    actions[0]?.click(); fixture.detectChanges();
    expect(page().querySelector('app-payment-modal')).not.toBeNull();
    expect(query('payment-modal')?.textContent).toContain('Cimento');
  });

  it('keeps the payment alert fixed at the top of the page', () => {
    alerts.next(response()); fixture.detectChanges();
    expect(query('payment-alert-banner')?.classList).toContain('sticky');
    expect(page().querySelector('app-alert-banner')).not.toBeNull();
  });

  function response(description = 'Cimento'): PaymentAlerts {
    return { projectId: activeProject.id, referenceDate: '2026-11-04', count: 3,
      totalAmount: 123.45, items: [
        { expenseId: '1', description, purchaseDate: '2026-10-01', dueDate: '2026-11-03', totalPrice: 23.45, urgency: 'OVERDUE' },
        { expenseId: '2', description: 'Hoje', purchaseDate: '2026-10-01', dueDate: '2026-11-04', totalPrice: 50, urgency: 'DUE_SOON' },
        { expenseId: '3', description: 'Semana', purchaseDate: '2026-10-01', dueDate: '2026-11-11', totalPrice: 50, urgency: 'REGULAR' },
      ] };
  }

  it('renders the real summary and all urgency labels with color and civil due dates', () => {
    alerts.next(response()); fixture.detectChanges();
    const banner = query('payment-alert-banner')?.textContent ?? '';
    expect(banner).toContain('Você tem 3 contas totalizando');
    expect(banner).toContain('123,45');
    expect(banner).toContain('a vencer nos próximos 7 dias');
    expect(banner).toContain('Ver Conta');
    const rows = page().querySelectorAll('[data-testid="payment-alert-item"]');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Cimento');
    expect(rows[0].textContent).toContain('03/11/2026');
    expect(rows[0].textContent).toContain('Vencida');
    expect(rows[1].textContent).toContain('Em até 3 dias');
    expect(rows[2].textContent).toContain('A Vencer');
  });

  it('navigates to the accounts page when Ver Conta is clicked', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    alerts.next(response()); fixture.detectChanges();
    const action = query('payment-alert-banner')?.querySelector('button');
    action?.click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/contas');
  });

  it('shows positive empty state only after a successful empty response', () => {
    expect(query('payment-alert-empty')).toBeNull();
    alerts.next({ ...response(), count: 0, totalAmount: 0, items: [] }); fixture.detectChanges();
    expect(query('payment-alert-empty')?.textContent).toContain('Nenhum pagamento pendente');
    expect(query('payment-alert-banner')).toBeNull();
  });

  it('distinguishes failure from empty and retries only on manual action', () => {
    alerts.error(new Error('network')); fixture.detectChanges();
    expect(query('payment-alert-error')).not.toBeNull();
    expect(query('payment-alert-empty')).toBeNull();
    expect(query('payment-alert-loading')).toBeNull();
    expect(paymentService.getAlerts).toHaveBeenCalledTimes(1);
    const retry = new Subject<PaymentAlerts>(); paymentService.getAlerts.and.returnValue(retry);
    click('retry-payment-alerts');
    expect(paymentService.getAlerts).toHaveBeenCalledTimes(2);
    retry.next(response()); fixture.detectChanges();
    expect(query('payment-alert-error')).toBeNull();
    expect(query('payment-alert-banner')).not.toBeNull();
  });

  it('does not query without a selected project and clears previous alerts', () => {
    alerts.next(response()); fixture.detectChanges();
    paymentService.getAlerts.calls.reset();
    activeProjectState.set(null); fixture.detectChanges();
    expect(paymentService.getAlerts).not.toHaveBeenCalled();
    expect(query('payment-alert-banner')).toBeNull();
  });

  it('rejects both old success and error in A → B → A even before effects run', () => {
    activeProjectState.set(anotherProject); activeProjectState.set(activeProject);
    alerts.next(response('Resposta antiga')); fixture.detectChanges();
    expect(query('payment-alert-banner')).toBeNull();
    const current = new Subject<PaymentAlerts>();
    paymentService.getAlerts.and.returnValue(current);
    component.reloadPaymentAlerts();
    alerts.error(new Error('old error')); fixture.detectChanges();
    expect(query('payment-alert-error')).toBeNull();
    current.next(response('Resposta atual')); fixture.detectChanges();
    expect(query('payment-alert-banner')).not.toBeNull();
  });

  it('displays a real UUID project without borrowing financial data from a mock', () => {
    expect(page().textContent).toContain(activeProject.name);
    expect(page().textContent).not.toContain('Cimento CP II 50kg');
  });

  it('should react when the global active project changes', () => {
    activeProjectState.set(anotherProject);
    fixture.detectChanges();

    expect(page().textContent).toContain(anotherProject.name);
    expect(page().textContent).not.toContain('Cimento CP II 50kg');
  });

  it('uses the global active project for the header and dashboard data', () => {
    expect(page().querySelector('h1')?.textContent).toContain(activeProject.name);
  });

  describe('budget availability', () => {
    function overview(projectId: string, budgetedCategories: number): BudgetOverview {
      return {
        projectId,
        totalPlanned: budgetedCategories > 0 ? 1000 : 0,
        totalSpent: 0,
        available: 0,
        globalPercentage: null,
        exceededCategories: 0,
        budgetedCategories,
        categories: [],
      };
    }

    function pendingRequestFor(projectId: string): Subject<BudgetOverview> {
      const request = overviewRequests.find((candidate) => candidate.projectId === projectId);
      expect(request).withContext(`consulta de orçamentos da obra ${projectId}`).toBeDefined();
      return request!.response;
    }

    function answer(projectId: string, response: BudgetOverview): void {
      pendingRequestFor(projectId).next(response);
      fixture.detectChanges();
    }

    it('asks the budget API about the active project', () => {
      expect(budgetService.getOverview).toHaveBeenCalledWith(activeProject.id);
    });

    it('does not advertise missing budgets while the budget API has not answered', () => {
      expect(query('define-project-budgets')).toBeNull();
      expect(query('generate-budget')).toBeNull();
      expect(page().textContent).not.toContain('Esta obra ainda não possui orçamentos');
    });

    it('shows the budget CTA when the API reports no budgeted category', () => {
      answer(activeProject.id, overview(activeProject.id, 0));

      const cta = query<HTMLAnchorElement>('define-project-budgets');
      expect(cta).not.toBeNull();
      expect(page().textContent).toContain('Esta obra ainda não possui orçamentos');
      expect(cta!.textContent).toContain('Definir Orçamentos da Obra');
      expect(cta!.getAttribute('href')).toBe('/orcamentos');
    });

    it('swaps the expense CTA for a budget CTA when the API reports no budgets', () => {
      answer(activeProject.id, overview(activeProject.id, 0));

      const cta = query<HTMLAnchorElement>('generate-budget');
      expect(cta).not.toBeNull();
      expect(cta!.textContent).toContain('Gerar Orçamento');
      expect(cta!.getAttribute('href')).toBe('/orcamentos');
      expect(page().textContent).not.toContain('Lançar Nova Despesa');
    });

    it('treats a project whose ceilings were all zeroed as having no budgets', () => {
      const zeroed = overview(activeProject.id, 0);
      zeroed.categories = [{
        categoryId: 'cat-1',
        categoryName: 'Alvenaria',
        plannedAmount: 0,
        spentAmount: 0,
        balanceAmount: 0,
        percentage: null,
        state: 'NO_BUDGET' as BudgetCategory['state'],
        hasBudget: true,
      }];
      answer(activeProject.id, zeroed);

      expect(query('define-project-budgets')).not.toBeNull();
    });

    it('hides the budget CTA when the API reports budgeted categories', () => {
      answer(activeProject.id, overview(activeProject.id, 3));

      expect(query('define-project-budgets')).toBeNull();
      expect(query('generate-budget')).toBeNull();
      expect(page().textContent).toContain('Lançar Nova Despesa');
    });

    it('does not advertise missing budgets when the budget API fails', () => {
      pendingRequestFor(activeProject.id).error(new Error('rede'));
      fixture.detectChanges();

      expect(query('define-project-budgets')).toBeNull();
      expect(page().textContent).toContain('Lançar Nova Despesa');
    });

    it('asks again for the new active project and ignores a late answer from the previous one', () => {
      activeProjectState.set(anotherProject);
      fixture.detectChanges();
      expect(budgetService.getOverview).toHaveBeenCalledWith(anotherProject.id);

      answer(activeProject.id, overview(activeProject.id, 0));
      expect(query('define-project-budgets')).withContext('resposta atrasada da obra anterior').toBeNull();

      answer(anotherProject.id, overview(anotherProject.id, 0));
      expect(query('define-project-budgets')).not.toBeNull();
    });

    it('forgets the previous project budget state when the active project changes', () => {
      answer(activeProject.id, overview(activeProject.id, 0));
      expect(query('define-project-budgets')).not.toBeNull();

      activeProjectState.set(anotherProject);
      fixture.detectChanges();

      expect(query('define-project-budgets')).toBeNull();
    });
  });

  describe('onboarding', () => {
    it('shows onboarding with a CTA to register the first project when the response is empty', () => {
      projectService.getProjects.and.returnValue(of([]));
      activeProjectState.set(null);
      component.reloadProjects();
      fixture.detectChanges();

      expect(page().textContent).toContain('Vamos começar sua obra');
      expect(page().textContent).toContain('Cadastrar primeira obra');
    });

    it('opens the existing project registration flow from the onboarding CTA', () => {
      projectService.getProjects.and.returnValue(of([]));
      activeProjectState.set(null);
      component.reloadProjects();
      fixture.detectChanges();

      expect(page().textContent).not.toContain('Cadastrar nova obra');
      click('onboarding-create-project');

      expect(page().textContent).toContain('Cadastrar nova obra');
    });

    it('leaves onboarding and shows the dashboard after the first project is saved', () => {
      projectService.getProjects.and.returnValue(of([]));
      activeProjectState.set(null);
      component.reloadProjects();
      fixture.detectChanges();

      expect(page().textContent).toContain('Vamos começar sua obra');

      click('onboarding-create-project');

      const firstProject: Project = {
        id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
        name: 'Primeira obra',
        type: ProjectType.NEW_CONSTRUCTION,
        location: 'Rua primeira',
        status: ProjectStatus.IN_PROGRESS,
        createdAt: '',
        updatedAt: '',
      };
      projectService.getProjects.and.returnValue(of([firstProject]));
      activeProjectState.set(firstProject);
      const callsBeforeSave = projectService.getProjects.calls.count();

      const projectModal = fixture.debugElement.query(By.directive(ProjectModalComponent))
        .componentInstance as ProjectModalComponent;
      projectModal.saved.emit(firstProject);
      fixture.detectChanges();

      expect(projectService.getProjects.calls.count()).toBe(callsBeforeSave + 1);
      expect(component.projects().map((project) => project.id)).toEqual([firstProject.id]);
      expect(page().textContent).not.toContain('Vamos começar sua obra');
      expect(page().querySelector('h1')?.textContent).toContain(firstProject.name);
    });

    it('does not show onboarding when the project list is not empty', () => {
      activeProjectState.set(null);
      component.reloadProjects();
      fixture.detectChanges();

      expect(page().textContent).not.toContain('Vamos começar sua obra');
    });

    it('leaves onboarding when a project becomes active without reloading the local list', () => {
      projectService.getProjects.and.returnValue(of([]));
      activeProjectState.set(null);
      component.reloadProjects();
      fixture.detectChanges();

      expect(page().textContent).toContain('Vamos começar sua obra');

      const firstProject: Project = {
        id: '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f6a',
        name: 'Obra cadastrada pela Navbar',
        type: ProjectType.NEW_CONSTRUCTION,
        location: 'Rua da Navbar',
        status: ProjectStatus.IN_PROGRESS,
        createdAt: '',
        updatedAt: '',
      };
      const callsBeforeActivation = projectService.getProjects.calls.count();

      // Simulates the Navbar modal's setActiveProject: only the global state changes.
      activeProjectState.set(firstProject);
      fixture.detectChanges();

      expect(page().textContent).not.toContain('Vamos começar sua obra');
      expect(page().querySelector('h1')?.textContent).toContain(firstProject.name);
      expect(component.projects()).toEqual([]);
      expect(projectService.getProjects.calls.count()).toBe(callsBeforeActivation);
    });
  });

  describe('project selection state', () => {
    it('renders a neutral select-a-project state when the list is filled but no project is active', () => {
      activeProjectState.set(null);
      component.reloadProjects();
      fixture.detectChanges();

      expect(query('select-project-empty-state')).not.toBeNull();
      expect(page().textContent).toContain('Selecione uma obra');
      expect(page().textContent).not.toContain('Vamos começar sua obra');
      expect(page().textContent).not.toContain('Carregando suas obras...');
    });
  });

  describe('project loading errors', () => {
    it('does not treat a project loading error as an empty project list', () => {
      projectService.getProjects.and.returnValue(throwError(() => new Error('network')));
      component.reloadProjects();
      fixture.detectChanges();

      expect(page().textContent).toContain('Não foi possível carregar suas obras');
      expect(page().textContent).not.toContain('Vamos começar sua obra');
    });

    it('reaches the loading error even when an active project is still in memory', () => {
      projectService.getProjects.and.returnValue(throwError(() => new Error('network')));
      component.reloadProjects();
      fixture.detectChanges();

      expect(activeProjectState()).toBe(activeProject);
      expect(query('projects-load-error')).not.toBeNull();
    });

    it('retries loading the projects from the error state', () => {
      projectService.getProjects.and.returnValue(throwError(() => new Error('network')));
      component.reloadProjects();
      fixture.detectChanges();

      projectService.getProjects.and.returnValue(of([activeProject]));
      const callsBeforeRetry = projectService.getProjects.calls.count();
      click('retry-load-projects');

      expect(projectService.getProjects.calls.count()).toBe(callsBeforeRetry + 1);
      expect(query('projects-load-error')).toBeNull();
      expect(page().textContent).toContain(activeProject.name);
    });
  });

  describe('delete project', () => {
    beforeEach(() => {
      projectService.getProjects.and.returnValue(of([activeProject, anotherProject]));
      component.reloadProjects();
      fixture.detectChanges();
    });

    it('shows an actionable delete error, closes the modal and keeps the project when deletion fails', () => {
      projectService.deleteProject.and.returnValue(throwError(() => new Error('network')));

      click('open-delete-project');
      click('confirm-confirmation');

      expect(projectService.deleteProject).toHaveBeenCalledWith(activeProject.id);
      expect(activeProjectState()).toBe(activeProject);
      expect(component.projects().map((project) => project.id)).toEqual([
        activeProject.id,
        anotherProject.id,
      ]);
      expect(query('confirm-confirmation')).toBeNull();
      expect(query('delete-project-error')).not.toBeNull();
      expect(page().textContent).toContain('Não foi possível excluir a obra');
      expect(query('retry-delete-project')).not.toBeNull();
    });

    it('reopens the delete confirmation from the error retry action', () => {
      projectService.deleteProject.and.returnValue(throwError(() => new Error('network')));
      click('open-delete-project');
      click('confirm-confirmation');

      expect(query('confirm-confirmation')).toBeNull();
      click('retry-delete-project');

      expect(query('confirm-confirmation')).not.toBeNull();
      expect(query('delete-project-error')).toBeNull();
    });

    it('names the project in the delete confirmation', () => {
      click('open-delete-project');

      const content = query<HTMLElement>('confirm-modal-content');
      expect(content).not.toBeNull();
      expect(content!.textContent).toContain(activeProject.name);
    });

    it('does not show the deletion error of a project after another project becomes active', () => {
      projectService.deleteProject.and.returnValue(throwError(() => new Error('network')));
      click('open-delete-project');
      click('confirm-confirmation');

      const error = query<HTMLElement>('delete-project-error');
      expect(error).not.toBeNull();
      expect(error!.textContent).toContain(activeProject.name);
      expect(error!.textContent).toContain('Não foi possível excluir a obra');

      activeProjectState.set(anotherProject);
      fixture.detectChanges();

      expect(query('delete-project-error')).toBeNull();
      expect(query('retry-delete-project')).toBeNull();
      expect(page().textContent).not.toContain('Não foi possível excluir a obra');
      expect(activeProjectState()).toBe(anotherProject);
      expect(component.projects().map((project) => project.id)).toEqual([
        activeProject.id,
        anotherProject.id,
      ]);
    });

    it('keeps the retry bound to the project that failed when it becomes active again', () => {
      projectService.deleteProject.and.returnValue(throwError(() => new Error('network')));
      click('open-delete-project');
      click('confirm-confirmation');

      activeProjectState.set(anotherProject);
      fixture.detectChanges();
      activeProjectState.set(activeProject);
      fixture.detectChanges();

      const error = query<HTMLElement>('delete-project-error');
      expect(error).not.toBeNull();
      expect(error!.textContent).toContain(activeProject.name);
      expect(page().querySelector('h1')?.textContent).toContain(activeProject.name);

      click('retry-delete-project');
      expect(query('confirm-modal-content')!.textContent).toContain(activeProject.name);

      projectService.deleteProject.and.returnValue(of(void 0));
      projectService.getProjects.and.returnValue(of([anotherProject]));
      click('confirm-confirmation');

      expect(projectService.deleteProject).toHaveBeenCalledWith(activeProject.id);
      expect(projectService.deleteProject).not.toHaveBeenCalledWith(anotherProject.id);
    });

    it('activates and persists the remaining project returned by the server after deletion', () => {
      projectService.getProjects.and.returnValue(of([anotherProject]));

      click('open-delete-project');
      click('confirm-confirmation');

      expect(projectService.deleteProject).toHaveBeenCalledWith(activeProject.id);
      expect(component.projects().map((project) => project.id)).toEqual([anotherProject.id]);
      expect(activeProjectState()).toBe(anotherProject);
      expect(page().querySelector('h1')?.textContent).toContain(anotherProject.name);
      expect(page().textContent).not.toContain(activeProject.name);
      expect(localStorage.getItem('active-project:user-1')).toBe(anotherProject.id);
      expect(query('confirm-confirmation')).toBeNull();
      expect(query('delete-project-error')).toBeNull();
      expect(query('select-project-empty-state')).toBeNull();
    });

    it('decides the active project from the refreshed server list when the local list is stale', () => {
      // The Navbar created anotherProject, so the Home list is stale and does not know it exists.
      component.projects.set([]);
      fixture.detectChanges();
      expect(component.showOnboarding()).toBeFalse();

      projectService.getProjects.and.returnValue(of([anotherProject]));

      click('open-delete-project');
      click('confirm-confirmation');

      expect(component.projects().map((project) => project.id)).toEqual([anotherProject.id]);
      expect(activeProjectState()).toBe(anotherProject);
      expect(page().querySelector('h1')?.textContent).toContain(anotherProject.name);
      expect(localStorage.getItem('active-project:user-1')).toBe(anotherProject.id);
      expect(page().textContent).not.toContain('Vamos começar sua obra');
      expect(query('select-project-empty-state')).toBeNull();
    });

    it('falls back to the local optimistic list when the refresh after deletion fails', () => {
      projectService.getProjects.and.returnValue(throwError(() => new Error('network')));

      click('open-delete-project');
      click('confirm-confirmation');

      expect(component.projects().map((project) => project.id)).toEqual([anotherProject.id]);
      expect(activeProjectState()).toBe(anotherProject);
      expect(page().querySelector('h1')?.textContent).toContain(anotherProject.name);
      expect(localStorage.getItem('active-project:user-1')).toBe(anotherProject.id);
      expect(query('projects-load-error')).toBeNull();
      expect(page().textContent).not.toContain('Não foi possível carregar suas obras');
    });

    it('returns to onboarding and clears the active project when the only project is deleted', () => {
      projectService.getProjects.and.returnValue(of([activeProject]));
      component.reloadProjects();
      fixture.detectChanges();

      projectService.getProjects.and.returnValue(of([]));

      click('open-delete-project');
      click('confirm-confirmation');

      expect(projectService.deleteProject).toHaveBeenCalledWith(activeProject.id);
      expect(activeProjectState()).toBeNull();
      expect(component.projects()).toEqual([]);
      expect(localStorage.getItem('active-project:user-1')).toBeNull();
      expect(page().textContent).toContain('Vamos começar sua obra');
      expect(page().textContent).toContain('Cadastrar primeira obra');
      expect(query('confirm-confirmation')).toBeNull();
    });

    it('does not delete or change the active project when exclusion is cancelled by button', () => {
      click('open-delete-project');

      click('cancel-confirmation');

      expect(projectService.deleteProject).not.toHaveBeenCalled();
      expect(activeProjectState()).toBe(activeProject);
      expect(query('cancel-confirmation')).toBeNull();
    });

    it('does not delete or change the active project when exclusion is cancelled with Escape', () => {
      click('open-delete-project');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(projectService.deleteProject).not.toHaveBeenCalled();
      expect(activeProjectState()).toBe(activeProject);
      expect(query('cancel-confirmation')).toBeNull();
    });

    it('does not delete or change the active project when the exclusion modal is closed', () => {
      click('open-delete-project');

      click('close-confirmation');

      expect(projectService.deleteProject).not.toHaveBeenCalled();
      expect(activeProjectState()).toBe(activeProject);
      expect(query('close-confirmation')).toBeNull();
    });
  });
});
