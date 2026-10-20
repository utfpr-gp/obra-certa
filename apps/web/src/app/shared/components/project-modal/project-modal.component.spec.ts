import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProjectModalComponent } from './project-modal.component';
import { ProjectService } from '../../../core/services/project.service';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../../core/services/authenticated-identity.service';
import { Project, ProjectStatus, ProjectType } from '../../../core/models/project.model';

const project: Project = {
  id: 'one',
  name: 'Casa principal',
  type: ProjectType.NEW_CONSTRUCTION,
  location: 'Rua A',
  status: ProjectStatus.IN_PROGRESS,
  createdAt: '',
  updatedAt: '',
};

describe('ProjectModalComponent', () => {
  let component: ProjectModalComponent;
  let fixture: ComponentFixture<ProjectModalComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let activeProjectService: jasmine.SpyObj<ActiveProjectService>;

  beforeEach(async () => {
    projectService = jasmine.createSpyObj('ProjectService', [
      'createProject',
      'updateProject',
    ]);
    activeProjectService = jasmine.createSpyObj('ActiveProjectService', ['setActiveProject']);

    await TestBed.configureTestingModule({
      imports: [ProjectModalComponent],
      providers: [
        { provide: ProjectService, useValue: projectService },
        { provide: ActiveProjectService, useValue: activeProjectService },
        {
          provide: AuthenticatedIdentityService,
          useValue: { getUserId: () => 'user-1' },
        },
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('project', project);
    fixture.detectChanges();
  });

  it('loads the current name and data when editing', () => {
    expect(component.form.value).toEqual({
      name: project.name,
      type: project.type,
      location: project.location ?? '',
      status: project.status,
    });
  });

  it('keeps filled form values and exposes a network error', () => {
    projectService.updateProject.and.returnValue(
      throwError(() => new Error('timeout')),
    );
    component.form.setValue({
      name: 'Nome alterado',
      type: ProjectType.RENOVATION,
      location: 'Novo local',
      status: ProjectStatus.PAUSED,
    });
    component.save();

    expect(component.form.value.name).toBe('Nome alterado');
    expect(component.errorMessage()).toContain('Não foi possível');
  });

  it('allows a new edit submission without retyping after a failed request', () => {
    const editedProject = { ...project, name: 'Nome salvo', type: ProjectType.RENOVATION, location: 'Novo local', status: ProjectStatus.PAUSED };
    projectService.updateProject.and.returnValues(
      throwError(() => new Error('timeout')),
      of(editedProject),
    );
    component.form.setValue({
      name: editedProject.name,
      type: editedProject.type,
      location: editedProject.location,
      status: editedProject.status,
    });

    component.save();
    expect(component.form.getRawValue()).toEqual({
      name: editedProject.name,
      type: editedProject.type,
      location: editedProject.location,
      status: editedProject.status,
    });

    component.save();

    expect(projectService.updateProject).toHaveBeenCalledTimes(2);
    expect(activeProjectService.setActiveProject).toHaveBeenCalledWith(
      editedProject,
      jasmine.any(String),
    );
  });

  it('allows a new create submission without retyping after a failed request', () => {
    const createdProject = { ...project, id: 'created', name: 'Nova obra', type: ProjectType.EXPANSION, location: 'Novo endereço' };
    projectService.createProject.and.returnValues(
      throwError(() => new Error('timeout')),
      of(createdProject),
    );
    fixture.componentRef.setInput('project', null);
    fixture.detectChanges();
    component.form.setValue({
      name: createdProject.name,
      type: createdProject.type,
      location: createdProject.location ?? '',
      status: ProjectStatus.IN_PROGRESS,
    });

    component.save();
    expect(component.form.getRawValue()).toEqual({
      name: createdProject.name,
      type: createdProject.type,
      location: createdProject.location,
      status: ProjectStatus.IN_PROGRESS,
    });

    component.save();

    expect(projectService.createProject).toHaveBeenCalledTimes(2);
    expect(activeProjectService.setActiveProject).toHaveBeenCalledWith(
      createdProject,
      jasmine.any(String),
    );
  });

  it('shows the budgets shortcut and navigates to budgets', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(component.closed, 'emit');
    expect(fixture.nativeElement.textContent).toContain('Definir Orçamentos');
    component.goToBudgets();
    expect(component.closed.emit).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/orcamentos']);
  });
});
