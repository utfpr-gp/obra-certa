import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideFileText, LucideInfo, LucidePieChart, LucidePiggyBank, LucideTrendingUp, LucideTriangleAlert, LucideWallet } from '@lucide/angular';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ReportService } from '../../core/services/report.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideFileText, LucideInfo, LucideTrendingUp, LucideCircleCheck, LucideCircleAlert],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent {
  readonly activeProject = inject(ActiveProjectService);
  private readonly reportService = inject(ReportService);
  private readonly report = signal<import('../../core/models/report.model').Report | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedCategory = signal('all');
  readonly pdfNotice = signal(false);
  readonly reportProjectName = computed(() => this.report()?.projectName ?? '');
  private requestGeneration = 0;
  private readonly colors = ['#00686d', '#00a2a8', '#8a6f2f', '#d77b24', '#8b5cf6', '#d64b5b', '#607d8b'];

  readonly categories = computed(() => (this.report()?.categories ?? []).map((category, index) => ({
    id: category.categoryId, name: category.categoryName, actualCents: Math.round(category.amount * 100),
    plannedCents: Math.round(category.plannedAmount * 100), color: this.colors[index % this.colors.length],
  })));
  readonly noExpenses = computed(() => this.report() !== null && this.report()?.totalSpent === 0);
  readonly visibleCategories = computed(() => this.categories().filter(category =>
    this.selectedCategory() === 'all' || category.id === this.selectedCategory()));
  readonly totals = computed(() => {
    const categories = this.visibleCategories();
    const allCategories = this.selectedCategory() === 'all';
    const plannedCents = allCategories ? Math.round((this.report()?.totalPlanned ?? 0) * 100)
      : categories.reduce((sum, category) => sum + category.plannedCents, 0);
    const actualCents = allCategories ? Math.round((this.report()?.totalSpent ?? 0) * 100)
      : categories.reduce((sum, category) => sum + category.actualCents, 0);
    const exceeded = categories.filter(category => category.plannedCents > 0
      && category.actualCents > category.plannedCents).length;
    return { plannedCents, actualCents, balanceCents: plannedCents - actualCents,
      consumption: plannedCents ? actualCents / plannedCents * 100 : null,
      exceeded };
  });
  readonly rows = computed(() => {
    let offset = 0;
    const total = this.totals().actualCents;
    return this.visibleCategories().map(category => {
      const share = total ? category.actualCents / total * 100 : 0;
      const row = { ...category, share, offset, segment: share - Math.min(0.28, share / 2),
        balanceCents: category.plannedCents - category.actualCents,
        consumption: category.plannedCents ? category.actualCents / category.plannedCents * 100 : null,
        exceeded: category.plannedCents > 0 && category.actualCents > category.plannedCents };
      offset += share;
      return row;
    });
  });
  readonly distributionRows = computed(() => this.rows().filter(row => row.actualCents > 0));
  readonly comparisonRows = computed(() => this.rows().filter(row => row.plannedCents > 0));
  readonly barMaximumCents = computed(() => Math.max(100,
    ...this.comparisonRows().flatMap(row => [row.plannedCents, row.actualCents])));
  readonly axisDivisor = computed(() => this.barMaximumCents() >= 100000 ? 100000 : 100);
  readonly axisTicks = computed(() => Array.from({ length: 5 }, (_, index) =>
    this.barMaximumCents() / this.axisDivisor() * index / 4));
  readonly largestExpenses = computed(() => [...this.distributionRows()].sort((a, b) => b.actualCents - a.actualCents).slice(0, 2));
  readonly exceededRows = computed(() => this.rows().filter(row => row.exceeded));
  readonly displayedShareTotal = computed(() => this.rows().reduce((sum, row) => sum + Math.round(row.share * 10) / 10, 0));
  private readonly currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly integerCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  constructor() {
    effect(() => {
      const project = this.activeProject.activeProject();
      const generation = ++this.requestGeneration;
      this.selectedCategory.set('all');
      this.report.set(null);
      this.error.set(null);
      if (!project) {
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.reportService.get(project.id).subscribe({
        next: report => {
          if (generation === this.requestGeneration && report.projectId === project.id) {
            this.report.set(report);
            this.loading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (generation !== this.requestGeneration) return;
          this.loading.set(false);
          this.error.set(error.status === 404 ? 'A obra não foi localizada.' : 'Não foi possível carregar os relatórios.');
        },
      });
    });
  }

  retry(): void {
    const project = this.activeProject.activeProject();
    if (!project) return;
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    const generation = ++this.requestGeneration;
    this.reportService.get(project.id).subscribe({
      next: report => {
        if (generation === this.requestGeneration && report.projectId === project.id) {
          this.report.set(report);
          this.loading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => { if (generation === this.requestGeneration) { this.loading.set(false); this.error.set(error.status === 404 ? 'A obra não foi localizada.' : 'Não foi possível carregar os relatórios.'); } },
    });
  }
  money(cents: number): string { return this.normalizeCurrency(this.currency.format(cents / 100)); }
  compactMoney(cents: number): string { return this.normalizeCurrency(this.integerCurrency.format(cents / 100)); }
  private normalizeCurrency(value: string): string { return value.replace(/[\u00a0\u202f]/g, ' '); }
  percent(value: number | null, digits = 1): string { return value === null ? '—' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`; }
  barWidth(cents: number): number { return cents / this.barMaximumCents() * 100; }
  progressWidth(value: number | null): number { return Math.min(value ?? 0, 100); }
  selectCategory(event: Event): void { this.selectedCategory.set((event.target as HTMLSelectElement).value); }
  showPdfNotice(): void { this.pdfNotice.set(true); }
}
