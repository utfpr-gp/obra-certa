import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { BudgetService } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetOverview, BudgetState } from '../../core/models/budget.model';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertBannerComponent, KpiCardComponent],
  templateUrl: './budgets-page.component.html',
  styleUrl: './budgets-page.component.css'
})
export class BudgetsPageComponent {
  private readonly activeProjectService = inject(ActiveProjectService);
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);

  readonly activeProject = this.activeProjectService.activeProject;
  readonly overview = signal<BudgetOverview | null>(null);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly isEmpty = computed(() => this.overview()?.categories.length === 0);

  /** Descarta a resposta de uma obra que deixou de ser a ativa durante a requisicao. */
  private requestId = 0;

  constructor() {
    effect(() => {
      const project = this.activeProject();
      if (!project) {
        this.requestId++;
        this.overview.set(null);
        this.categories.set([]);
        this.loading.set(false);
        this.loadError.set('');
        return;
      }
      this.load(project.id);
    });
  }

  retry(): void {
    const project = this.activeProject();
    if (project) {
      this.load(project.id);
    }
  }

  formatBrl(value: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value ?? 0);
  }

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return `${new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)}%`;
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
