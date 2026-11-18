import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCheck, LucideChevronDown, LucideHome, LucideLogOut, LucideMenu, LucidePlus } from '@lucide/angular';
import { Project, PROJECT_TYPE_LABELS } from '../../../core/models/project.model';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../../core/services/authenticated-identity.service';
import { Auth } from '../../../core/services/auth';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ProjectModalComponent, ConfirmModalComponent, LucideCheck, LucideChevronDown, LucideHome, LucideLogOut, LucideMenu, LucidePlus],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly projectService = inject(ProjectService);
  private readonly activeProjectService = inject(ActiveProjectService);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly userId = inject(AuthenticatedIdentityService).getUserId();

  toggleSidebar = output<void>();
  readonly projects = signal<Project[]>([]);
  readonly projectsLoadError = signal('');
  readonly activeProject = this.activeProjectService.activeProject;
  readonly activeProjectTypeLabel = computed(() => {
    const project = this.activeProject();
    return project ? PROJECT_TYPE_LABELS[project.type] : 'Nenhuma obra ativa';
  });
  readonly deskDropdownOpen = signal(false);
  readonly mobileSheetOpen = signal(false);
  readonly projectModalOpen = signal(false);
  readonly projectBeingEdited = signal<Project | null>(null);
  readonly deleteModalOpen = signal(false);
  readonly deleteConfirmationMessage = computed(() => {
    const project = this.activeProject();
    return project
      ? `Tem certeza que deseja excluir a obra "${project.name}"? Esta ação não poderá ser desfeita.`
      : '';
  });

  constructor() {
    this.loadProjects();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }

  toggleDeskDropdown(event?: Event): void {
    event?.stopPropagation();
    const willOpen = !this.deskDropdownOpen();
    this.deskDropdownOpen.set(willOpen);
    if (willOpen) this.loadProjects();
  }

  openMobileSheet(): void { this.mobileSheetOpen.set(true); }
  closeMobileSheet(): void { this.mobileSheetOpen.set(false); }

  closeAll(): void {
    this.deskDropdownOpen.set(false);
    this.mobileSheetOpen.set(false);
  }

  selectProject(project: Project, event?: Event): void {
    event?.stopPropagation();
    this.activeProjectService.selectProject(project, this.userId);
    this.closeAll();
  }

  openProjectModal(project: Project | null = null): void {
    this.projectBeingEdited.set(project);
    this.projectModalOpen.set(true);
    this.closeAll();
  }

  closeProjectModal(): void {
    this.projectModalOpen.set(false);
    this.projectBeingEdited.set(null);
  }

  onProjectSaved(project: Project): void {
    const projects = this.projects();
    const index = projects.findIndex((item) => item.id === project.id);
    if (index === -1) this.projects.set([...projects, project]);
    else this.projects.set(projects.map((item) => item.id === project.id ? project : item));
    this.closeProjectModal();
  }

  goToBudgets(): void {
    void this.router.navigate(['/orcamentos']);
  }

  retryLoadProjects(): void {
    this.loadProjects();
  }

  openDeleteModal(): void {
    this.closeProjectModal();
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
  }

  confirmDeleteProject(): void {
    const project = this.activeProject();
    if (!project) return;
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        const remaining = this.projects().filter((p) => p.id !== project.id);
        this.projects.set(remaining);
        this.activeProjectService.initialize(remaining, this.userId);
        this.closeDeleteModal();
      },
      error: () => this.closeDeleteModal(),
    });
  }

  onMenuClick(): void { this.toggleSidebar.emit(); }
  onLogout(): void { this.authService.logout(); }

  private loadRequestId = 0;

  private loadProjects(): void {
    const requestId = ++this.loadRequestId;
    this.projectsLoadError.set('');
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        if (requestId !== this.loadRequestId) return;
        this.projects.set(projects);
        this.activeProjectService.initialize(projects, this.userId);
      },
      error: () => {
        if (requestId !== this.loadRequestId) return;
        this.projectsLoadError.set(
          'Não foi possível carregar suas obras. Verifique sua conexão e tente novamente.',
        );
      },
    });
  }
}
