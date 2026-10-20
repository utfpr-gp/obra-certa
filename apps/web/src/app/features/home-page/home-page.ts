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
  readonly deleteError = signal('');
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
  readonly showOnboarding = computed(
    () => !this.projectsLoading() && !this.projectsLoadError() && this.projects().length === 0,
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
  }

  openDeleteModal(): void {
    this.deleteError.set('');
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
        this.closeDeleteModal();
      },
      error: () => {
        this.deleteError.set(
          'Não foi possível excluir a obra. Verifique sua conexão e tente novamente.',
        );
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
