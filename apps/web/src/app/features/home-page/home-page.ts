import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, Subscription, switchMap, tap } from 'rxjs';
import { PaymentAlertItem, PaymentAlerts, PaymentTarget, PaymentUrgency } from '../../core/models/payment.model';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';
import { PaymentService } from '../../core/services/payment.service';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetOverview, hasUnbudgetedExpenses } from '../../core/models/budget.model';
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
  private paymentGeneration = 0;
  private destroyed = false;
  readonly paymentAlerts = signal<PaymentAlerts | null>(null);
  private readonly dismissedPaymentAlertContext = signal<number | null>(null);
  readonly paymentAlertDismissed = computed(() =>
    this.dismissedPaymentAlertContext() === this.activeProjectService.contextVersion());

  dismissPaymentAlert(): void {
    this.dismissedPaymentAlertContext.set(this.activeProjectService.contextVersion());
  }
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
  readonly budgetOverview = signal<BudgetOverview | null>(null);
  readonly activeBudget = computed(() => {
    const overview = this.budgetOverview();
    return overview?.projectId === this.activeProject()?.id ? overview : null;
  });
  readonly recentExpenses = signal<DespesaRecente[]>([]);
  readonly recentExpensesLoading = signal(false);
  readonly recentExpensesError = signal(false);
  private readonly recentExpensesRefresh = signal(0);
  readonly activeObra = computed<DashboardView | null>(() => {
    const project = this.activeProject();
    if (!project) return null;
    const budget = this.activeBudget();
    return {
      ...emptyDashboard(project.name),
      percentualGasto: budget?.globalPercentage ?? 0,
      totalGasto: budget?.totalSpent ?? 0,
      orcamentoTotal: budget?.totalPlanned ?? 0,
      saldoDisponivel: budget?.available ?? 0,
      categorias: budget?.categories.map((category) => ({
        id: category.categoryId,
        nome: category.categoryName,
        orcado: category.plannedAmount,
        gasto: category.spentAmount,
        percentual: category.percentage,
        emRisco: category.state === 'WARNING' || category.state === 'EXCEEDED'
          || hasUnbudgetedExpenses(category),
        corBorda: category.state === 'EXCEEDED' || hasUnbudgetedExpenses(category) ? '#EF4444'
          : category.state === 'WARNING' ? '#F59E0B' : '#007A80',
      })) ?? [],
      ultimosGastos: this.recentExpenses(),
    };
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
  readonly riskCategoryCount = computed(() =>
    this.activeObra()?.categorias.filter((category) => category.emRisco).length ?? 0,
  );

  constructor() {
    this.reloadProjects();
    this.watchBudgetAvailability();
    toObservable(computed(() => ({
      projectId: this.activeProject()?.id,
      context: this.activeProjectService.contextVersion(),
      refresh: this.recentExpensesRefresh(),
    }))).pipe(
      switchMap(({ projectId }) => {
        this.recentExpenses.set([]);
        this.recentExpensesError.set(false);
        this.recentExpensesLoading.set(!!projectId);
        return projectId ? this.expenseService.list(projectId, 0, 5).pipe(
          map(({ content }) => content.map((expense): DespesaRecente => ({
            id: expense.id,
            descricao: expense.description,
            categoriaNome: expense.categoryName,
            valor: expense.totalPrice,
            dataTexto: formatCivilDateValue(expense.purchaseDate),
            status: expense.paid ? 'pago' : 'pendente',
          }))),
          catchError(() => {
            this.recentExpensesError.set(true);
            return of([]);
          }),
        ) : of([]);
      }),
      takeUntilDestroyed(),
    ).subscribe((expenses) => {
      this.recentExpenses.set(expenses);
      this.recentExpensesLoading.set(false);
    });
    effect(() => {
      this.activeProjectService.contextVersion();
      untracked(() => {
        this.paymentSelection.set(null);
        this.paymentSettlement.set(null);
        this.reloadPaymentAlerts();
      });
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.paymentRequest?.unsubscribe();
    });
  }

  private watchBudgetAvailability(): void {
    toObservable(this.activeProject)
      .pipe(
        map((project) => project?.id ?? null),
        distinctUntilChanged(),
        tap(() => {
          this.budgetAvailability.set('unknown');
          this.budgetOverview.set(null);
        }),
        switchMap((projectId) =>
          projectId
            ? this.budgetService.getOverview(projectId).pipe(
                tap((overview) => this.budgetOverview.set(overview)),
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

  reloadRecentExpenses(): void {
    this.recentExpensesRefresh.update((value) => value + 1);
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
