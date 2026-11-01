import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { RouterLink } from '@angular/router';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse, ExpenseTab, ExpenseTotals, ExpenseFilters, ExpenseSupplier } from '../../core/models/expense-registration.model';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <main class="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 class="text-2xl md:text-3xl font-bold text-slate-900">Contas a pagar</h1>
        <p class="mt-1 text-sm text-slate-500">Cadastre as despesas da sua obra.</p>
      </header>
      <section aria-labelledby="new-account-title" class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <h2 id="new-account-title" class="text-lg font-semibold text-slate-900">Nova conta</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-600">
            Informe os dados da despesa, o vencimento quando houver pagamento pendente e, se desejar, anexe um comprovante.
          </p>
        </div>
        <a
          routerLink="/contas/nova"
          class="btn-oc-primary min-h-11 w-full shrink-0 md:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc"
          data-testid="create-account"
        >Cadastrar conta</a>
      </section>
      <details data-testid="filters-panel" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm"
        (toggle)="onFiltersToggle($event)">
        <summary class="min-h-11 cursor-pointer font-semibold text-slate-800">Filtros</summary>
        <form data-testid="expense-filters" [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="mt-4 space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            @for (field of dateFields; track field.key) {
              <div>
                <label [for]="'filter-' + field.key" class="mb-1 block text-sm font-medium text-slate-800">{{ field.label }}</label>
                <input type="date" [id]="'filter-' + field.key" [attr.data-testid]="'filter-' + field.key"
                  [formControlName]="field.key" [attr.aria-invalid]="validationAttempted() && filterForm.hasError(field.period)"
                  [attr.aria-describedby]="validationAttempted() && filterForm.hasError(field.period) ? field.period + '-error' : null"
                  class="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800" />
              </div>
            }
          </div>
          @if (validationAttempted() && filterForm.hasError('purchaseDate')) {
            <p id="purchaseDate-error" role="alert" class="text-sm text-rose-700">A data inicial da compra não pode ser posterior à final.</p>
          }
          @if (validationAttempted() && filterForm.hasError('dueDate')) {
            <p id="dueDate-error" role="alert" class="text-sm text-rose-700">A data inicial do vencimento não pode ser posterior à final.</p>
          }
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label for="filter-categoryIds" class="mb-1 block text-sm font-medium text-slate-800">Categorias</label>
              <select id="filter-categoryIds" data-testid="filter-categoryIds" formControlName="categoryIds" multiple
                aria-describedby="categories-help" class="min-h-24 w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
                @for (category of categories(); track category.id) { <option [value]="category.id">{{ category.name }}</option> }
              </select>
              <p id="categories-help" class="mt-1 text-xs text-slate-500">Selecione uma ou mais categorias. Sem seleção, inclui todas.</p>
            </div>
            <div>
              <label for="filter-supplierId" class="mb-1 block text-sm font-medium text-slate-800">Fornecedor</label>
              <select id="filter-supplierId" data-testid="filter-supplierId" formControlName="supplierId"
                class="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800">
                <option value="">Todos os fornecedores</option>
                @for (supplier of suppliers(); track supplier.id) { <option [value]="supplier.id">{{ supplier.name }}</option> }
              </select>
            </div>
          </div>
          @if (catalogsLoading()) { <p role="status" class="text-sm text-slate-500">Carregando categorias e fornecedores...</p> }
          @if (catalogError()) {
            <div role="alert" class="text-sm text-rose-700">
              <p>{{ catalogError() }}</p><button type="button" class="min-h-11 underline" (click)="loadCatalogs()">Tentar carregar opções novamente</button>
            </div>
          }
          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="submit" class="btn-oc-primary min-h-11">Aplicar filtros</button>
            <button type="button" data-testid="clear-filters" class="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700" (click)="clearFilters()">Limpar filtros</button>
          </div>
        </form>
      </details>
      @if (totals(); as totals) {
        <section aria-label="Totalizadores das despesas" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article data-testid="total-paid" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <h2 class="text-xs font-medium text-slate-500">Total Pago</h2>
            <p class="mt-2 text-2xl font-bold text-slate-800">{{ totals.totalPaid | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</p>
          </article>
          <article data-testid="total-pending" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <h2 class="text-xs font-medium text-slate-500">Total a Pagar</h2>
            <p class="mt-2 text-2xl font-bold text-primary-oc">{{ totals.totalPending | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</p>
          </article>
          <article data-testid="total-general" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <h2 class="text-xs font-medium text-slate-500">Total Geral</h2>
            <p class="mt-2 text-2xl font-bold text-slate-800">{{ totals.totalGeneral | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</p>
          </article>
        </section>
      }
      <section aria-labelledby="accounts-list-title" class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 id="accounts-list-title" class="sr-only">Despesas cadastradas</h2>
        <nav aria-label="Situação das despesas" class="flex gap-2 border-b border-slate-200 p-4">
          @for (option of tabs; track option.value) {
            <button type="button" [attr.data-testid]="'expense-tab-' + option.value"
              [attr.aria-selected]="tab() === option.value" (click)="selectTab(option.value)"
              class="rounded-lg px-3 py-2 text-sm">{{ option.label }}</button>
          }
        </nav>
        @if (error()) {
          <div role="alert" class="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{{ error() }}</p>
            <button type="button" data-testid="retry-expenses" class="mt-2 underline" (click)="retry()">Tentar novamente</button>
          </div>
        }
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">Descrição</th><th class="px-4 py-3">Categoria</th>
              <th class="px-4 py-3">Fornecedor</th><th class="px-4 py-3">Compra</th>
              <th class="px-4 py-3">Vencimento</th><th class="px-4 py-3">Valor</th>
              <th class="px-4 py-3">Situação</th><th class="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (expense of expenses(); track expense.id) {
              <tr class="border-b border-slate-100">
                <td class="px-4 py-3 font-medium text-slate-900">{{ expense.description }}</td>
                <td class="px-4 py-3">{{ expense.categoryName }}</td>
                <td class="px-4 py-3">{{ expense.supplier.name }}</td>
                <td class="px-4 py-3">{{ expense.purchaseDate | date:'dd/MM/yyyy' }}</td>
                <td class="px-4 py-3">{{ expense.dueDate ? (expense.dueDate | date:'dd/MM/yyyy') : '—' }}</td>
                <td class="px-4 py-3">{{ expense.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                <td class="px-4 py-3">{{ expense.paid ? 'Pago' : 'Pendente' }}</td>
                <td class="px-4 py-3"><a class="text-primary-oc underline" [routerLink]="['/despesas', expense.id]">Consultar</a></td>
              </tr>
            }
          </tbody>
        </table>
        <nav data-testid="pagination" aria-label="Paginação" class="flex items-center justify-between border-t border-slate-200 p-4">
          <button type="button" [disabled]="page() === 0" (click)="loadPage(page() - 1)">Anterior</button>
          <span>Página {{ page() + 1 }} de {{ totalPages() }}</span>
          <button type="button" [disabled]="page() + 1 >= totalPages()" (click)="loadPage(page() + 1)">Próxima</button>
        </nav>
      </section>
    </main>
  `,
})
export class AccountsPageComponent {
  private readonly activeProject = inject(ActiveProjectService);
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly supplierService = inject(SupplierService);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly suppliers = signal<ExpenseSupplier[]>([]);
  readonly catalogsLoading = signal(false);
  readonly catalogError = signal<string | null>(null);
  private catalogsLoaded = false;
  readonly validationAttempted = signal(false);
  readonly filters = signal<ExpenseFilters>({});
  readonly dateFields = [
    { key: 'purchaseDateFrom', label: 'Compra a partir de', period: 'purchaseDate' },
    { key: 'purchaseDateTo', label: 'Compra até', period: 'purchaseDate' },
    { key: 'dueDateFrom', label: 'Vencimento a partir de', period: 'dueDate' },
    { key: 'dueDateTo', label: 'Vencimento até', period: 'dueDate' },
  ];
  readonly filterForm = inject(FormBuilder).nonNullable.group({
    purchaseDateFrom: '', purchaseDateTo: '', dueDateFrom: '', dueDateTo: '',
    categoryIds: [[] as string[]], supplierId: '',
  }, { validators: (control: AbstractControl): ValidationErrors | null => {
    const errors: ValidationErrors = {};
    for (const period of ['purchaseDate', 'dueDate']) {
      const from = control.get(period + 'From')?.value as string;
      const to = control.get(period + 'To')?.value as string;
      if (from && to && from > to) errors[period] = true;
    }
    return Object.keys(errors).length ? errors : null;
  } });
  readonly totals = signal<ExpenseTotals | null>(null);
  readonly expenses = signal<ExpenseResponse[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly tab = signal<ExpenseTab>('ALL');
  readonly tabs: { value: ExpenseTab; label: string }[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'PENDING', label: 'Pendentes' },
    { value: 'OVERDUE', label: 'Vencidas' },
    { value: 'PAID', label: 'Pagas' },
  ];
  readonly error = signal<string | null>(null);
  private readonly size = 15;
  private lastProjectId: string | undefined;
  private lastPage = 0;
  private tabVersion = 0;

  constructor() {
    effect(() => {
      const project = this.activeProject.activeProject();
      if (project) untracked(() => this.loadPage(0, project.id));
      else {
        this.expenses.set([]);
        this.totals.set(null);
        this.error.set(null);
      }
    });
  }

  loadPage(page: number, projectId = this.activeProject.activeProject()?.id): void {
    if (!projectId || page < 0) return;
    if (this.filterForm.invalid) { this.showInvalidFilters(); return; }
    this.lastProjectId = projectId;
    this.lastPage = page;
    const tabVersion = this.tabVersion;
    this.error.set(null);
    this.expenses.set([]);
    this.totals.set(null);
    this.expenseService.list(projectId, page, this.size, this.tab(), this.filters()).subscribe({
      next: response => {
        if (this.activeProject.activeProject()?.id !== projectId || this.tabVersion !== tabVersion) return;
        this.page.set(response.page);
        this.totalPages.set(Math.max(response.totalPages, 1));
        this.expenses.set(response.content);
        this.totals.set(response.totals);
      },
      error: () => {
        if (this.activeProject.activeProject()?.id !== projectId || this.tabVersion !== tabVersion) return;
        this.error.set('Não foi possível carregar as despesas. Tente novamente.');
      },
    });
  }

  selectTab(tab: ExpenseTab): void {
    if (this.tab() === tab) return;
    this.tabVersion++;
    this.tab.set(tab);
    this.page.set(0);
    this.loadPage(0);
  }

  onFiltersToggle(event: Event): void {
    if ((event.target as HTMLDetailsElement).open && !this.catalogsLoaded) this.loadCatalogs();
  }

  loadCatalogs(): void {
    if (this.catalogsLoading()) return;
    this.catalogsLoading.set(true);
    this.catalogError.set(null);
    forkJoin({ categories: this.categoryService.getCategories(), suppliers: this.supplierService.getSuppliers() })
      .subscribe({
        next: result => {
          this.categories.set(result.categories);
          this.suppliers.set(result.suppliers);
          this.catalogsLoaded = true;
          this.catalogsLoading.set(false);
        },
        error: () => {
          this.catalogsLoading.set(false);
          this.catalogError.set('Não foi possível carregar as opções de filtro. Tente novamente.');
        },
      });
  }

  applyFilters(): void {
    this.validationAttempted.set(true);
    if (this.filterForm.invalid) { this.showInvalidFilters(); return; }
    const value = this.filterForm.getRawValue();
    const filters: ExpenseFilters = {};
    for (const key of ['purchaseDateFrom', 'purchaseDateTo', 'dueDateFrom', 'dueDateTo', 'supplierId'] as const) {
      if (value[key]) filters[key] = value[key];
    }
    if (value.categoryIds.length) filters.categoryIds = [...value.categoryIds];
    this.filters.set(filters);
    this.tabVersion++;
    this.page.set(0);
    this.loadPage(0);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.validationAttempted.set(false);
    this.filters.set({});
    this.tabVersion++;
    this.page.set(0);
    this.loadPage(0);
  }

  private showInvalidFilters(): void {
    this.tabVersion++;
    this.validationAttempted.set(true);
    this.filterForm.markAllAsTouched();
    this.expenses.set([]);
    this.totals.set(null);
    this.error.set(null);
  }

  retry(): void {
    if (this.lastProjectId) this.loadPage(this.lastPage, this.lastProjectId);
  }
}
