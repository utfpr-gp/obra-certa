import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { Project, ProjectStatus, ProjectType } from '../../core/models/project.model';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthenticatedIdentityService } from '../../core/services/authenticated-identity.service';
import { of, throwError } from 'rxjs';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let activeProjectState: ReturnType<typeof signal<Project | null>>;
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

  beforeEach(async () => {
    activeProjectState = signal<Project | null>(activeProject);
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', [
      'getProjects',
      'deleteProject',
    ]);
    projectService.getProjects.and.returnValue(of([activeProject]));
    projectService.deleteProject.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        {
          provide: ActiveProjectService,
          useValue: {
            activeProject: activeProjectState,
          },
        },
        { provide: ProjectService, useValue: projectService },
        {
          provide: AuthenticatedIdentityService,
          useValue: { getUserId: () => 'user-1' },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the home page', () => {
    expect(component).toBeTruthy();
  });

  it('displays a real UUID project without borrowing financial data from a mock', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(activeProject.name);
    expect(compiled.textContent).toContain('Ainda não há dados financeiros disponíveis');
    expect(compiled.textContent).not.toContain('Cimento CP II 50kg');
  });

  it('should react when the global active project changes', () => {
    const nextProject = {
      ...activeProject,
      id: '7f8c0a6d-2b4e-4e6e-9f4c-1d9a2a4b5c6d',
      name: 'Outra obra ativa',
    };
    activeProjectState.set(nextProject);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(nextProject.name);
    expect(compiled.textContent).not.toContain('Cimento CP II 50kg');
  });

  it('uses the global active project for the header and dashboard data', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(activeProject.name);
    expect(compiled.textContent).toContain('Ainda não há dados financeiros disponíveis');
  });

  it('shows onboarding with a CTA to register the first project when there are no projects', () => {
    projectService.getProjects.and.returnValue(of([]));
    activeProjectState.set(null);
    component.reloadProjects();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Vamos começar sua obra');
    expect(compiled.textContent).toContain('Cadastrar primeira obra');
  });

  it('opens the existing project registration flow from the onboarding CTA', () => {
    activeProjectState.set(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Cadastrar nova obra');
    (fixture.nativeElement.querySelector('[data-testid="onboarding-create-project"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cadastrar nova obra');
  });

  it('shows the budget CTA for an active project without budgets and navigates to budgets', () => {
    component.budgetAvailability.set('none');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cta = compiled.querySelector('[data-testid="define-project-budgets"]') as HTMLAnchorElement;

    expect(compiled.textContent).toContain('Esta obra ainda não possui orçamentos');
    expect(cta.textContent).toContain('Definir Orçamentos da Obra');
    expect(cta.getAttribute('href')).toBe('/orcamentos');
  });

  it('shows onboarding only when the real project response is empty', () => {
    projectService.getProjects.and.returnValue(of([activeProject]));
    activeProjectState.set(null);
    component.reloadProjects();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Vamos começar sua obra');
  });

  it('does not treat a project loading error as an empty project list', () => {
    projectService.getProjects.and.returnValue(throwError(() => new Error('network')));
    component.reloadProjects();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar suas obras');
    expect(fixture.nativeElement.textContent).not.toContain('Vamos começar sua obra');
  });

  it('shows an actionable delete error and keeps the project when deletion fails', () => {
    projectService.deleteProject.and.returnValue(throwError(() => new Error('network')));
    component.openDeleteModal();
    component.confirmDeleteProject();
    fixture.detectChanges();

    expect(component.activeProject()).toBe(activeProject);
    expect(fixture.nativeElement.textContent).toContain('Não foi possível excluir a obra');
  });

  it('does not delete or change the active project when exclusion is cancelled by button', () => {
    (fixture.nativeElement.querySelector('[data-testid="open-delete-project"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-confirm-modal [data-testid="cancel-confirmation"]')?.parentElement?.parentElement?.parentElement as HTMLElement;
    expect(modal).not.toBeNull();
    (modal.querySelector('[data-testid="cancel-confirmation"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(projectService.deleteProject).not.toHaveBeenCalled();
    expect(activeProjectState()).toBe(activeProject);
    expect(fixture.nativeElement.querySelector('app-confirm-modal [data-testid="cancel-confirmation"]')).toBeNull();
  });

  it('does not delete or change the active project when exclusion is cancelled with Escape', () => {
    (fixture.nativeElement.querySelector('[data-testid="open-delete-project"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(projectService.deleteProject).not.toHaveBeenCalled();
    expect(activeProjectState()).toBe(activeProject);
    expect(fixture.nativeElement.querySelector('app-confirm-modal [data-testid="cancel-confirmation"]')).toBeNull();
  });

  it('does not delete or change the active project when the exclusion modal is closed', () => {
    (fixture.nativeElement.querySelector('[data-testid="open-delete-project"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-confirm-modal') as HTMLElement;
    (modal.querySelector('[data-testid="close-confirmation"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(projectService.deleteProject).not.toHaveBeenCalled();
    expect(activeProjectState()).toBe(activeProject);
  });
});
