import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NavbarComponent } from './navbar.component';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../../core/services/authenticated-identity.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectType, ProjectStatus } from '../../../core/models/project.model';

const projects: Project[] = [
  {
    id: 'one',
    name: 'Casa principal',
    type: ProjectType.NEW_CONSTRUCTION,
    location: 'Rua A',
    status: ProjectStatus.IN_PROGRESS,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'two',
    name: 'Reforma cozinha',
    type: ProjectType.RENOVATION,
    location: 'Rua B',
    status: ProjectStatus.PAUSED,
    createdAt: '',
    updatedAt: '',
  },
];

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let activeProjectService: jasmine.SpyObj<ActiveProjectService>;
  let projectService: jasmine.SpyObj<ProjectService>;

  beforeEach(async () => {
    activeProjectService = jasmine.createSpyObj('ActiveProjectService', [
      'initialize',
      'selectProject',
    ]);
    Object.defineProperty(activeProjectService, 'activeProject', {
      value: () => projects[0],
    });
    projectService = jasmine.createSpyObj('ProjectService', ['getProjects']);
    projectService.getProjects.and.returnValue(of(projects));

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ActiveProjectService, useValue: activeProjectService },
        {
          provide: AuthenticatedIdentityService,
          useValue: { getUserId: () => 'user-1' },
        },
        { provide: ProjectService, useValue: projectService },
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists projects and alternates the active project', () => {
    expect(component.projects()).toEqual(projects);
    component.selectProject(projects[1]);
    expect(activeProjectService.selectProject).toHaveBeenCalledWith(
      projects[1],
      jasmine.any(String),
    );
  });

  it('opens the edit modal with the current project', () => {
    component.openProjectModal(projects[0]);
    expect(component.projectModalOpen()).toBeTrue();
    expect(component.projectBeingEdited()).toEqual(projects[0]);
  });

  it('navigates to budgets from the quick action', async () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.goToBudgets();
    expect(router.navigate).toHaveBeenCalledWith(['/orcamentos']);
  });

  it('exposes an actionable error when the initial project load fails', () => {
    projectService.getProjects.and.returnValue(
      throwError(() => new Error('timeout')),
    );
    const failedFixture = TestBed.createComponent(NavbarComponent);
    const failedComponent = failedFixture.componentInstance;
    failedFixture.detectChanges();

    expect(failedComponent.projectsLoadError()).toContain('Não foi possível');
    expect(failedFixture.nativeElement.textContent).toContain('Tentar novamente');
  });

  it('retries the initial project load after an error', () => {
    projectService.getProjects.and.returnValues(
      throwError(() => new Error('timeout')),
      of(projects),
    );
    const failedFixture = TestBed.createComponent(NavbarComponent);
    const failedComponent = failedFixture.componentInstance;
    failedFixture.detectChanges();

    failedComponent.retryLoadProjects();

    expect(failedComponent.projects()).toEqual(projects);
    expect(failedComponent.projectsLoadError()).toBe('');
    expect(activeProjectService.initialize).toHaveBeenCalledWith(
      projects,
      jasmine.any(String),
    );
  });
});
