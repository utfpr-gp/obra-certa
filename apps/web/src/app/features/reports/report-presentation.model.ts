import { computed, signal } from '@angular/core';
import { Report } from '../../core/models/report.model';

/** One presentation model used by the screen and the isolated global export. */
export class ReportPresentationModel {
  readonly report = signal<Report | null>(null);
  readonly selectedCategory = signal('all');
  readonly reportProjectName = computed(() => this.report()?.projectName ?? '');
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

  money(cents: number): string { return this.normalizeCurrency(this.currency.format(cents / 100)); }
  compactMoney(cents: number): string { return this.normalizeCurrency(this.integerCurrency.format(cents / 100)); }
  private normalizeCurrency(value: string): string { return value.replace(/[\u00a0\u202f]/g, ' '); }
  percent(value: number | null, digits = 1): string { return value === null ? '—' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`; }
  barWidth(cents: number): number { return cents / this.barMaximumCents() * 100; }
  progressWidth(value: number | null): number { return Math.min(value ?? 0, 100); }
}
