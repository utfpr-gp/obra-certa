import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaymentAlerts, PaymentUrgency } from '../../core/models/payment.model';
import { PaymentService } from '../../core/services/payment.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoriaOrcamento, ContaPagar, DespesaRecente } from '../../core/models/obra.model';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../core/services/authenticated-identity.service';
import { ProjectService } from '../../core/services/project.service';
import { BudgetService } from '../../core/services/budget.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
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
  private budgetService = inject(BudgetService);
  private userId = inject(AuthenticatedIdentityService).getUserId();
  private readonly payments = inject(PaymentService);
  private readonly destroyRef = inject(DestroyRef);
  private paymentRequest?: Subscription;
  private paymentGeneration = 0;
  private destroyed = false;
  readonly paymentAlerts = signal<PaymentAlerts | null>(null);
  readonly paymentLoading = signal(false);
  readonly paymentError = signal(false);

  readonly activeProject = this.activeProjectService.activeProject;
  readonly projects = signal<Project[]>([]);
  readonly projectsLoading = signal(true);
  readonly projectsLoadError = signal('');
  readonly projectModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly deleteFailure = signal<{ id: string; name: string } | null>(null);
  readonly budgetAvailability = signal<BudgetAvailability>('unknown');
  /**
   * The remaining dashboard metrics stay empty until their real endpoints are
   * integrated; payment alerts use their own query state below.
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
    this.watchBudgetAvailability();
    effect(() => {
      this.activeProjectService.contextVersion();
      untracked(() => this.reloadPaymentAlerts());
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.paymentRequest?.unsubscribe();
    });
  }

  /**
   * CA5 da US14: o banner de obra sem orcamentos depende da API da US07. A cada troca
   * de obra o estado volta a 'unknown' ate a resposta chegar; o switchMap descarta a
   * resposta atrasada da obra anterior. Teto zerado conta como sem orcamento, e em
   * falha o estado fica 'unknown' para nao anunciar um vazio que nao foi confirmado.
   */
  private watchBudgetAvailability(): void {
    toObservable(this.activeProject)
      .pipe(
        map((project) => project?.id ?? null),
        distinctUntilChanged(),
        tap(() => this.budgetAvailability.set('unknown')),
        switchMap((projectId) =>
          projectId
            ? this.budgetService.getOverview(projectId).pipe(
                map((overview): BudgetAvailability =>
                  overview.budgetedCategories > 0 ? 'available' : 'none',
                ),
                catchError(() => of<BudgetAvailability>('unknown')),
              )
            : of<BudgetAvailability>('unknown'),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((availability) => this.budgetAvailability.set(availability));
  }

  reloadPaymentAlerts(): void {
    const generation = ++this.paymentGeneration;
    const context = this.activeProjectService.contextVersion();
    const projectId = this.activeProject()?.id;
    this.paymentRequest?.unsubscribe();
    this.paymentAlerts.set(null);
    this.paymentError.set(false);
    this.paymentLoading.set(!!projectId);
    if (!projectId) return;
    const current = () => !this.destroyed && generation === this.paymentGeneration
      && context === this.activeProjectService.contextVersion()
      && projectId === this.activeProject()?.id;
    this.paymentRequest = this.payments.getAlerts(projectId).subscribe({
      next: result => {
        if (!current()) return;
        this.paymentAlerts.set(result);
        this.paymentLoading.set(false);
      },
      error: () => {
        if (!current()) return;
        this.paymentError.set(true);
        this.paymentLoading.set(false);
      },
    });
  }

  paymentUrgencyLabel(urgency: PaymentUrgency): string {
    return { OVERDUE: 'Vencida', DUE_SOON: 'Vence em até 3 dias', REGULAR: 'Vence em até 7 dias' }[urgency];
  }

  formatCivilDate(value: string): string {
    return value.split('-').reverse().join('/');
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
        const remaining = this.projects().filter((item) => item.id !== project.id);
        this.projects.set(remaining);
        this.deleteFailure.set(null);
        this.closeDeleteModal();
        this.refreshActiveProject(remaining);
      },
      error: () => {
        this.closeDeleteModal();
        this.deleteFailure.set({ id: project.id, name: project.name });
      },
    });
  }

  /**
   * The local list can be stale (a project created by the Navbar is not known
   * here), so the active project is decided from the server list. On failure,
   * the optimistic list already applied is the best local knowledge; the
   * deletion succeeded, so this must not surface the global load error.
   */
  private refreshActiveProject(fallback: Project[]): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.activeProjectService.initialize(projects, this.userId);
      },
      error: () => {
        this.activeProjectService.initialize(fallback, this.userId);
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
