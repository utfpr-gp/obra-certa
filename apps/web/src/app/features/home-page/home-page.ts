import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaymentAlertItem, PaymentAlerts, PaymentTarget, PaymentUrgency } from '../../core/models/payment.model';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { BudgetCategory, BudgetOverview } from '../../core/models/budget.model';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';
import { PaymentService } from '../../core/services/payment.service';
import { BudgetService } from '../../core/services/budget.service';
import { ExpenseService } from '../../core/services/expense.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CategoriaOrcamento, ContaPagar, DespesaRecente } from '../../core/models/obra.model';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { AuthenticatedIdentityService } from '../../core/services/authenticated-identity.service';
import { ProjectService } from '../../core/services/project.service';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { RadialGaugeComponent } from '../../shared/components/radial-gauge/radial-gauge.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CategoryProgressCardComponent } from '../../shared/components/category-progress-card/category-progress-card.component';
import { BadgeStatus, StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ProjectModalComponent } from '../../shared/components/project-modal/project-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatCivilDate as formatCivilDateValue } from '../../shared/utils/civil-date';
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
    PaymentModalComponent,
    RouterLink,
    RadialGaugeComponent,
    KpiCardComponent,
    CategoryProgressCardComponent,
    StatusBadgeComponent,
    AlertBannerComponent,
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
  private userId = inject(AuthenticatedIdentityService).getUserId();
  private readonly payments = inject(PaymentService);
  private readonly budgetService = inject(BudgetService);
  private readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private paymentRequest?: Subscription;
  private dashboardRequest?: Subscription;
  readonly budgetOverview = signal<BudgetOverview | null>(null);
  readonly recentExpenses = signal<ExpenseResponse[]>([]);
  readonly dashboardError = signal(false);
  private paymentGeneration = 0;
  private destroyed = false;
  readonly paymentAlerts = signal<PaymentAlerts | null>(null);
  readonly paymentLoading = signal(false);
  readonly paymentError = signal(false);
  readonly paymentSettlement = signal<ExpenseResponse | null>(null);
  private readonly paymentSelection = signal<{ projectId: string; context: number; target: PaymentTarget } | null>(null);
  readonly selectedPayment = computed(() => {
    const selection = this.paymentSelection();
    return selection?.context === this.activeProjectService.contextVersion()
      && selection.projectId === this.activeProject()?.id ? selection : null;
  });

  readonly activeProject = this.activeProjectService.activeProject;
  readonly projects = signal<Project[]>([]);
  readonly projectsLoading = signal(true);
  readonly projectsLoadError = signal('');
  readonly projectModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly deleteFailure = signal<{ id: string; name: string } | null>(null);
  readonly budgetAvailability = signal<BudgetAvailability>('unknown');
  readonly activeObra = computed<DashboardView | null>(() => {
    const project = this.activeProject();
    return project ? toDashboard(project.name, this.budgetOverview(), this.recentExpenses()) : null;
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
    effect(() => {
      this.activeProjectService.contextVersion();
      untracked(() => {
        this.paymentSelection.set(null);
        this.paymentSettlement.set(null);
        this.reloadPaymentAlerts();
        this.reloadDashboard();
      });
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.paymentRequest?.unsubscribe();
      this.dashboardRequest?.unsubscribe();
    });
  }

  reloadDashboard(): void {
    const projectId = this.activeProject()?.id;
    const context = this.activeProjectService.contextVersion();
    this.dashboardRequest?.unsubscribe();
    this.budgetOverview.set(null);
    this.recentExpenses.set([]);
    this.budgetAvailability.set('unknown');
    this.dashboardError.set(false);
    if (!projectId) return;
    const current = () => !this.destroyed && context === this.activeProjectService.contextVersion()
      && projectId === this.activeProject()?.id;
    const failed = () => {
      if (current()) this.dashboardError.set(true);
    };
    const request = new Subscription();
    this.dashboardRequest = request;
    request.add(this.budgetService.getOverview(projectId).subscribe({
      next: (overview) => {
        if (!current()) return;
        this.budgetOverview.set(overview);
        this.budgetAvailability.set(overview.budgetedCategories === 0 ? 'none' : 'available');
      },
      error: failed,
    }));
    request.add(this.expenseService.list(projectId, 0, 5, 'ALL').subscribe({
      next: (expenses) => {
        if (current()) this.recentExpenses.set(expenses.content);
      },
      error: failed,
    }));
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

  urgencyBadgeStatus(urgency: PaymentUrgency): BadgeStatus {
    return { OVERDUE: 'vencido', DUE_SOON: 'amanha', REGULAR: 'futuro' }[urgency] as BadgeStatus;
  }

  urgencyBadgeLabel(urgency: PaymentUrgency): string {
    return { OVERDUE: 'Vencida', DUE_SOON: 'Em até 3 dias', REGULAR: 'A Vencer' }[urgency];
  }

  formatCivilDate(value: string): string {
    return formatCivilDateValue(value);
  }

  openPayment(item: PaymentAlertItem): void {
    const projectId = this.activeProject()?.id;
    const alerts = this.paymentAlerts();
    if (!projectId || !alerts || alerts.projectId !== projectId || !alerts.items.includes(item)) return;
    this.paymentSelection.set({ projectId, context: this.activeProjectService.contextVersion(),
      target: { ...item, referenceDate: alerts.referenceDate } });
  }

  goToAccounts(): void {
    this.router.navigateByUrl('/contas');
  }

  closePayment(): void { this.paymentSelection.set(null); }

  onPaymentSettled(expense: ExpenseResponse): void {
    const selection = this.selectedPayment();
    if (!selection || expense.projectId !== selection.projectId || expense.id !== selection.target.expenseId || !expense.paid) return;
    this.closePayment();
    this.paymentSettlement.set(expense);
    this.reloadPaymentAlerts();
    this.reloadDashboard();
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

function toDashboard(name: string, overview: BudgetOverview | null, expenses: ExpenseResponse[]): DashboardView {
  const base = emptyDashboard(name);
  if (!overview) return base;
  return {
    ...base,
    percentualGasto: overview.globalPercentage ?? 0,
    totalGasto: overview.totalSpent,
    orcamentoTotal: overview.totalPlanned,
    saldoDisponivel: overview.available,
    categorias: overview.categories.filter((category) => category.hasBudget).map(toCategoria),
    ultimosGastos: expenses.map(toDespesa),
  };
}

function toCategoria(category: BudgetCategory): CategoriaOrcamento {
  const emRisco = category.state === 'WARNING' || category.state === 'EXCEEDED';
  return {
    id: category.categoryId,
    nome: category.categoryName,
    orcado: category.plannedAmount,
    gasto: category.spentAmount,
    percentual: category.percentage ?? 0,
    emRisco,
    corBorda: category.state === 'EXCEEDED' ? '#EF4444' : category.state === 'WARNING' ? '#F59E0B' : '#007A80',
  };
}

function toDespesa(expense: ExpenseResponse): DespesaRecente {
  return {
    id: expense.id,
    descricao: expense.description,
    categoriaNome: expense.categoryName,
    valor: expense.totalPrice,
    dataTexto: formatCivilDateValue(expense.purchaseDate),
    status: expense.paid ? 'pago' : 'pendente',
  };
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
