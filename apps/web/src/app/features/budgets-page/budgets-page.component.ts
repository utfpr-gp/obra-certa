import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { BudgetService } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetCategory, BudgetOverview, BudgetState, hasUnbudgetedExpenses } from '../../core/models/budget.model';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { formatPercentage } from '../../shared/utils/format-percentage';
import { BudgetFormModalComponent } from './components/budget-form-modal/budget-form-modal.component';
import { HoverScrollDirective } from '../../shared/directives/hover-scroll.directive';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [
    HoverScrollDirective,
    CommonModule,
    RouterLink,
    AlertBannerComponent,
    KpiCardComponent,
    BudgetFormModalComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './budgets-page.component.html',
  styleUrl: './budgets-page.component.css'
})
export class BudgetsPageComponent {
  private readonly activeProjectService = inject(ActiveProjectService);
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);

  readonly activeProject = this.activeProjectService.activeProject;
  private readonly activeProjectId = computed(() => this.activeProject()?.id ?? null);
  readonly overview = signal<BudgetOverview | null>(null);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly isEmpty = computed(() => this.overview()?.categories.length === 0);
  readonly exceededCategoryCount = computed(() => {
    const overview = this.overview();
    if (!overview) return 0;

    const unbudgetedCategoryCount = overview.categories.filter(hasUnbudgetedExpenses).length;
    return overview.exceededCategories + unbudgetedCategoryCount;
  });

  readonly modalOpen = signal(false);
  readonly modalProjectId = signal<string | null>(null);
  readonly modalEditingCategory = signal<BudgetCategory | null>(null);
  readonly modalPreselectedCategoryId = signal<string | null>(null);

  readonly zeroModalOpen = signal(false);
  readonly zeroSaving = signal(false);
  readonly zeroError = signal('');
  private zeroContextId = 0;
  readonly zeroTarget = signal<BudgetCategory | null>(null);
  readonly zeroProjectId = signal<string | null>(null);
  readonly zeroConfirmationMessage = computed(() => {
    const target = this.zeroTarget();
    if (!target) {
      return '';
    }
    return `O orçamento de ${target.categoryName} será definido como R$ 0,00. O registro é mantido para as despesas já lançadas.`;
  });

  /** Categorias que ainda nao tem registro ativo e podem receber um novo teto. */
  readonly budgetableCategories = computed<ExpenseCategory[]>(() => {
    const rows = this.overview()?.categories ?? [];
    const withBudget = new Set(
      rows.filter((row) => row.hasBudget).map((row) => row.categoryId),
    );
    return this.categories().filter((category) => !withBudget.has(category.id));
  });

  /** Na edicao o seletor mostra apenas a categoria travada. */
  readonly modalCategories = computed<ExpenseCategory[]>(() => {
    const editing = this.modalEditingCategory();
    if (editing) {
      return [{ id: editing.categoryId, name: editing.categoryName }];
    }
    return this.budgetableCategories();
  });

  /** Descarta a resposta de uma obra que deixou de ser a ativa durante a requisicao. */
  private requestId = 0;

  constructor() {
    effect(() => {
      const projectId = this.activeProjectId();
      // Metadados da mesma obra atualizam a tela sem abandonar o contexto do painel.
      untracked(() => {
        this.closeBudgetForm();
        this.closeZeroConfirm();
        if (!projectId) {
          this.requestId++;
          this.overview.set(null);
          this.categories.set([]);
          this.loading.set(false);
          this.loadError.set('');
          return;
        }
        this.load(projectId);
      });
    });
  }

  retry(): void {
    const project = this.activeProject();
    if (project) {
      this.load(project.id);
    }
  }

  /**
   * Abre o formulario. Sem categoria e criacao livre; com categoria sem registro ativo
   * e "Definir teto"; com categoria que ja tem orcamento e edicao com a categoria travada.
   */
  openBudgetForm(category: BudgetCategory | null = null): void {
    const project = this.activeProject();
    if (!project) {
      return;
    }
    this.modalProjectId.set(project.id);
    this.modalEditingCategory.set(category?.hasBudget ? category : null);
    this.modalPreselectedCategoryId.set(
      category && !category.hasBudget ? category.categoryId : null,
    );
    this.modalOpen.set(true);
  }

  closeBudgetForm(): void {
    this.modalOpen.set(false);
    this.modalProjectId.set(null);
    this.modalEditingCategory.set(null);
    this.modalPreselectedCategoryId.set(null);
  }

  /** Recarrega o painel do servidor; nada e atualizado de forma otimista. */
  onBudgetSaved(): void {
    const projectId = this.modalProjectId();
    const activeProject = this.activeProject();
    this.closeBudgetForm();
    if (projectId && activeProject?.id === projectId) {
      this.load(projectId);
    }
  }

  /** Abre a confirmacao guardando a obra ativa no momento do clique. */
  openZeroConfirm(category: BudgetCategory): void {
    const project = this.activeProject();
    if (!project) {
      return;
    }
    this.zeroContextId++;
    this.zeroSaving.set(false);
    this.zeroError.set('');
    this.zeroProjectId.set(project.id);
    this.zeroTarget.set(category);
    this.zeroModalOpen.set(true);
  }

  closeZeroConfirm(): void {
    this.zeroContextId++;
    this.zeroSaving.set(false);
    this.zeroError.set('');
    this.zeroModalOpen.set(false);
    this.zeroTarget.set(null);
    this.zeroProjectId.set(null);
  }

  /** So a confirmacao chama a API; cancelar, X e Escape fecham sem requisicao. */
  confirmZero(): void {
    const projectId = this.zeroProjectId();
    const target = this.zeroTarget();
    if (!projectId || !target || !this.zeroModalOpen() || this.zeroSaving()
        || this.activeProject()?.id !== projectId) {
      return;
    }
    const context = this.zeroContextId;
    this.zeroSaving.set(true);
    this.zeroError.set('');
    this.budgetService.zeroBudget(projectId, target.categoryId).subscribe({
      next: () => {
        if (context !== this.zeroContextId || this.activeProject()?.id !== projectId) return;
        const activeProject = this.activeProject();
        this.closeZeroConfirm();
        if (activeProject?.id === projectId) {
          this.load(projectId);
        }
      },
      error: () => {
        if (context !== this.zeroContextId || this.activeProject()?.id !== projectId) return;
        this.zeroSaving.set(false);
        this.zeroError.set('Não foi possível zerar o orçamento. Verifique sua conexão e tente novamente.');
      },
    });
  }

  formatBrl(value: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value ?? 0);
  }

  readonly hasUnbudgetedExpenses = hasUnbudgetedExpenses;

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return formatPercentage(value, 1);
  }

  barWidth(percentage: number | null): string {
    return `${Math.min(percentage ?? 0, 100)}%`;
  }

  stateLabel(state: BudgetState): string {
    switch (state) {
      case 'ON_TRACK':
        return 'Dentro do orçamento';
      case 'WARNING':
        return 'Atenção';
      case 'EXCEEDED':
        return 'Estourado';
      case 'NO_BUDGET':
        return 'Sem orçamento';
    }
  }

  stateClasses(state: BudgetState): string {
    switch (state) {
      case 'ON_TRACK':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EXCEEDED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'NO_BUDGET':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  barClasses(state: BudgetState): string {
    switch (state) {
      case 'ON_TRACK':
        return 'bg-emerald-500';
      case 'WARNING':
        return 'bg-amber-500';
      case 'EXCEEDED':
        return 'bg-rose-500';
      case 'NO_BUDGET':
        return 'bg-slate-400';
    }
  }

  private load(projectId: string): void {
    const request = ++this.requestId;
    this.loading.set(true);
    this.loadError.set('');
    this.overview.set(null);
    this.categories.set([]);

    forkJoin({
      overview: this.budgetService.getOverview(projectId),
      categories: this.categoryService.getCategories(),
    }).subscribe({
      next: ({ overview, categories }) => {
        if (request !== this.requestId) {
          return;
        }
        this.overview.set(overview);
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        if (request !== this.requestId) {
          return;
        }
        this.loading.set(false);
        this.loadError.set(
          'Não foi possível carregar os orçamentos. Verifique sua conexão e tente novamente.',
        );
      },
    });
  }
}
