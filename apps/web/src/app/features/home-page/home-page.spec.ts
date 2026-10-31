import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { Project, ProjectStatus, ProjectType } from '../../core/models/project.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthenticatedIdentityService } from '../../core/services/authenticated-identity.service';
import { ProjectModalComponent } from '../../shared/components/project-modal/project-modal.component';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let activeProjectService: ActiveProjectService;
  let activeProjectState: (() => Project | null) & {
    set: (project: Project | null) => void;
  };
  let projectService: jasmine.SpyObj<ProjectService>;

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
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', [
      'getProjects',
      'deleteProject',
    ]);
    projectService.getProjects.and.returnValue(of([activeProject]));
    projectService.deleteProject.and.returnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: ProjectService, useValue: projectService },
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

  it('displays a real UUID project without borrowing financial data from a mock', () => {
    expect(page().textContent).toContain(activeProject.name);
    expect(page().textContent).toContain('Ainda não há dados financeiros disponíveis');
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
    expect(page().textContent).toContain('Ainda não há dados financeiros disponíveis');
  });

  describe('budget availability', () => {
    it('does not advertise missing budgets while the budget state is unknown', () => {
      expect(component.budgetAvailability()).toBe('unknown');
      expect(query('define-project-budgets')).toBeNull();
      expect(page().textContent).not.toContain('Esta obra ainda não possui orçamentos');
    });

    it('shows the budget CTA only when the active project explicitly has no budgets', () => {
      component.budgetAvailability.set('none');
      fixture.detectChanges();

      const cta = query<HTMLAnchorElement>('define-project-budgets');
      expect(cta).not.toBeNull();
      expect(page().textContent).toContain('Esta obra ainda não possui orçamentos');
      expect(cta!.textContent).toContain('Definir Orçamentos da Obra');
      expect(cta!.getAttribute('href')).toBe('/orcamentos');
    });

    it('does not show the budget CTA when the active project has budgets', () => {
      component.budgetAvailability.set('available');
      fixture.detectChanges();

      expect(query('define-project-budgets')).toBeNull();
      expect(page().textContent).not.toContain('Esta obra ainda não possui orçamentos');
    });

    it('does not infer missing budgets from a zeroed dashboard total', () => {
      expect(component.activeObra()?.orcamentoTotal).toBe(0);
      expect(query('define-project-budgets')).toBeNull();
    });

    it('swaps the expense CTA for a budget CTA when the active project has no budgets', () => {
      component.budgetAvailability.set('none');
      fixture.detectChanges();

      const cta = query<HTMLAnchorElement>('generate-budget');
      expect(cta).not.toBeNull();
      expect(cta!.textContent).toContain('Gerar Orçamento');
      expect(cta!.getAttribute('href')).toBe('/orcamentos');
      expect(page().textContent).not.toContain('Lançar Nova Despesa');
    });

    it('keeps the expense CTA when the active project has budgets', () => {
      component.budgetAvailability.set('available');
      fixture.detectChanges();

      expect(query('generate-budget')).toBeNull();
      expect(page().textContent).toContain('Lançar Nova Despesa');
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
      expect(page().textContent).toContain('Ainda não há dados financeiros disponíveis');
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
      expect(page().textContent).toContain('Ainda não há dados financeiros disponíveis');
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
      expect(page().textContent).not.toContain('Ainda não há dados financeiros disponíveis');
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
      expect(page().textContent).toContain('Ainda não há dados financeiros disponíveis');
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
