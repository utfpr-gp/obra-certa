import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideTrash2 } from '@lucide/angular';
import { Project, ProjectStatus, ProjectType } from '../../../core/models/project.model';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../../core/services/authenticated-identity.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideTrash2],
  templateUrl: './project-modal.component.html',
})
export class ProjectModalComponent {
  readonly isOpen = input(false);
  readonly project = input<Project | null>(null);
  readonly closed = output<void>();
  readonly saved = output<Project>();
  readonly deleteRequested = output<void>();
  readonly errorMessage = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: [ProjectType.NEW_CONSTRUCTION as ProjectType, Validators.required],
    location: [''],
    status: [ProjectStatus.IN_PROGRESS as ProjectStatus, Validators.required],
  });

  private readonly projectService = inject(ProjectService);
  private readonly activeProjectService = inject(ActiveProjectService);
  private readonly identityService = inject(AuthenticatedIdentityService);

  constructor() {
    effect(() => {
      const project = this.project();
      this.form.reset(project ? {
        name: project.name,
        type: project.type,
        location: project.location ?? '',
        status: project.status,
      } : {
        name: '',
        type: ProjectType.NEW_CONSTRUCTION,
        location: '',
        status: ProjectStatus.IN_PROGRESS,
      });
      this.errorMessage.set('');
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.errorMessage.set('');
    const value = this.form.getRawValue();
    const project = this.project();
    const request = project
      ? this.projectService.updateProject(project.id, value)
      : this.projectService.createProject({ name: value.name, type: value.type, location: value.location });
    request.subscribe({
      next: (saved) => {
        this.activeProjectService.setActiveProject(saved, this.identityService.getUserId());
        this.saved.emit(saved);
      },
      error: () => this.errorMessage.set('Não foi possível salvar a obra. Verifique sua conexão e tente novamente.'),
    });
  }

}
