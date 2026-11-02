import { Component, computed, signal } from '@angular/core';
import { REPORT_DEMO_CATEGORIES } from './reports-demo.data';
import { LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideFileText, LucideInfo, LucideTrendingUp, LucideCircleCheck, LucideCircleAlert } from '@lucide/angular';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideFileText, LucideInfo, LucideTrendingUp, LucideCircleCheck, LucideCircleAlert],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent {
  readonly categories = REPORT_DEMO_CATEGORIES;
  readonly selectedCategory = signal('all');
  readonly pdfNotice = signal(false);
  readonly axisTicks = [0, 35, 70, 105, 140];
  readonly visibleCategories = computed(() => this.categories.filter(category =>
    this.selectedCategory() === 'all' || category.id === this.selectedCategory()));
  readonly totals = computed(() => {
    const categories = this.visibleCategories();
    const plannedCents = categories.reduce((sum, category) => sum + category.plannedCents, 0);
    const actualCents = categories.reduce((sum, category) => sum + category.actualCents, 0);
    return { plannedCents, actualCents, balanceCents: plannedCents - actualCents,
      consumption: actualCents / plannedCents * 100,
      exceeded: categories.filter(category => category.actualCents > category.plannedCents).length };
  });
  readonly rows = computed(() => {
    let offset = 0;
    return this.visibleCategories().map(category => {
      const share = category.actualCents / this.totals().actualCents * 100;
      const row = { ...category, share, offset, balanceCents: category.plannedCents - category.actualCents,
        consumption: category.actualCents / category.plannedCents * 100,
        exceeded: category.actualCents > category.plannedCents };
      offset += share;
      return row;
    });
  });
  readonly largestExpenses = computed(() => [...this.rows()].sort((a, b) => b.actualCents - a.actualCents).slice(0, 2));
  readonly exceededRows = computed(() => this.rows().filter(row => row.exceeded));
  readonly displayedShareTotal = computed(() => this.rows().reduce((sum, row) => sum + Math.round(row.share * 10) / 10, 0));
  private readonly currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly integerCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  money(cents: number): string { return this.currency.format(cents / 100); }
  compactMoney(cents: number): string { return this.integerCurrency.format(cents / 100); }
  percent(value: number, digits = 1): string {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
  }
  barWidth(cents: number): number { return cents / 14000000 * 100; }
  progressWidth(value: number): number { return Math.min(value, 100); }
  selectCategory(event: Event): void { this.selectedCategory.set((event.target as HTMLSelectElement).value); }
  showPdfNotice(): void { this.pdfNotice.set(true); }
}
