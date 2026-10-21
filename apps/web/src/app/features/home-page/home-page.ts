import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoriaOrcamento, ContaPagar, DespesaRecente } from '../../core/models/obra.model';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ProjectService } from '../../core/services/project.service';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { RadialGaugeComponent } from '../../shared/components/radial-gauge/radial-gauge.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CategoryProgressCardComponent } from '../../shared/components/category-progress-card/category-progress-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ProjectModalComponent } from '../../shared/components/project-modal/project-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Project } from '../../core/models/project.model';
import {
  LucideHome,
  LucidePlusCircle,
  LucideClock,
  LucideCheckCircle,
  LucideArrowRight
} from '@lucide/angular';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AlertBannerComponent,
    RadialGaugeComponent,
    KpiCardComponent,
    CategoryProgressCardComponent,
    StatusBadgeComponent,
    ProjectModalComponent,
    ConfirmModalComponent,
    LucideHome,
    LucidePlusCircle,
    LucideClock,
    LucideCheckCircle,
    LucideArrowRight
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  private activeProjectService = inject(ActiveProjectService);
  private projectService = inject(ProjectService);

  readonly activeProject = this.activeProjectService.activeProject;
  readonly projects = signal<Project[]>([]);
  readonly projectsLoading = signal(true);
  readonly projectsLoadError = signal('');
  readonly projectModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly deleteFailure = signal<{ id: string; name: string } | null>(null);
  readonly budgetAvailability = signal<BudgetAvailability>('unknown');
  /**
   * Financial endpoints are not part of this task yet. Keep the dashboard
   * explicitly empty rather than associating mock financial records by id.
   */
  readonly activeObra = computed<DashboardView | null>(() => {
    const project = this.activeProject();
    return project ? emptyDashboard(project.name) : null;
  });
  readonly hasNoBudgets = computed(() => {
    const obra = this.activeObra();
    return !!obra && this.budgetAvailability() === 'none';
  });
  /**
   * The deletion failure belongs to the project that failed. It is only shown
   * while that project is active, so the retry can never target another project.
   */
  readonly deleteError = computed(() => {
    const failure = this.deleteFailure();
    const project = this.activeProject();
    if (!failure || project?.id !== failure.id) return '';
    return `Não foi possível excluir a obra "${failure.name}". Verifique sua conexão e tente novamente.`;
  });
  readonly deleteConfirmationMessage = computed(() => {
    const project = this.activeProject();
    const target = project
      ? `A obra "${project.name}" será removida da sua lista.`
      : 'A obra será removida da sua lista.';
    return `${target} Deseja continuar?`;
  });
  readonly showOnboarding = computed(
    () =>
      !this.projectsLoading() &&
      !this.projectsLoadError() &&
      this.projects().length === 0 &&
      !this.activeProject(),
  );
  readonly riskCategories = computed(() => {
    const obra = this.activeObra();
    return obra?.categorias.filter((category) => category.emRisco || category.percentual >= 90) ?? [];
  });

  readonly firstRiskCategory = computed(() => {
    const list = this.riskCategories();
    return list.length > 0 ? list[0] : null;
  });

  constructor() {
    this.reloadProjects();
  }

  reloadProjects(): void {
    this.projectsLoading.set(true);
    this.projectsLoadError.set('');
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.projectsLoading.set(false);
      },
      error: () => {
        this.projectsLoading.set(false);
        this.projectsLoadError.set(
          'Não foi possível carregar suas obras. Verifique sua conexão e tente novamente.',
        );
      },
    });
  }

  formatBrl(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatBrlShort(value: number): string {
    return this.formatBrl(value);
  }

  openProjectModal(): void {
    this.projectModalOpen.set(true);
  }

  closeProjectModal(): void {
    this.projectModalOpen.set(false);
  }

  onProjectSaved(): void {
    this.closeProjectModal();
    this.reloadProjects();
  }

  openDeleteModal(): void {
    this.deleteFailure.set(null);
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
        this.activeProjectService.clear();
        this.projects.update((projects) => projects.filter((item) => item.id !== project.id));
        this.deleteFailure.set(null);
        this.closeDeleteModal();
      },
      error: () => {
        this.closeDeleteModal();
        this.deleteFailure.set({ id: project.id, name: project.name });
      },
    });
  }
}

type BudgetAvailability = 'unknown' | 'none' | 'available';

interface DashboardView {
  nome: string;
  percentualGasto: number;
  totalGasto: number;
  orcamentoTotal: number;
  saldoDisponivel: number;
  contasAVencerQtd: number;
  alertaHoje?: { titulo: string; detalhe: string };
  categorias: CategoriaOrcamento[];
  contasProximas: ContaPagar[];
  ultimosGastos: DespesaRecente[];
}

function emptyDashboard(name: string): DashboardView {
  return {
    nome: name,
    percentualGasto: 0,
    totalGasto: 0,
    orcamentoTotal: 0,
    saldoDisponivel: 0,
    contasAVencerQtd: 0,
    categorias: [],
    contasProximas: [],
    ultimosGastos: [],
  };
}
