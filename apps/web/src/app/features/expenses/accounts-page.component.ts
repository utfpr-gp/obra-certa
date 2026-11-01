import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { RouterLink } from '@angular/router';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse, ExpenseTab, ExpenseTotals, ExpenseFilters, ExpenseSupplier, ExpenseSort } from '../../core/models/expense-registration.model';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <main class="min-w-0 p-4 md:p-6 lg:p-8 space-y-6">
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
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <label for="expense-sort" class="text-sm font-medium text-slate-800">Ordenar por</label>
        <select id="expense-sort" data-testid="expense-sort" [value]="sort()" (change)="selectSort($event)"
          class="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:w-auto">
          @for (option of sortOptions; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
        </select>
      </div>
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav data-testid="expense-tabs" role="tablist" aria-label="Situação das despesas" class="grid grid-cols-2 gap-2 border-b border-slate-200 p-4 sm:flex">
          @for (option of tabs; track option.value) {
            <button type="button" [attr.data-testid]="'expense-tab-' + option.value"
              role="tab" [attr.id]="'expense-tab-' + option.value"
              aria-controls="expenses-panel"
              [attr.aria-selected]="tab() === option.value" [attr.tabindex]="tab() === option.value ? 0 : -1"
              [class.bg-primary-oc]="tab() === option.value" [class.text-white]="tab() === option.value"
              (click)="selectTab(option.value)" (keydown)="onTabKeydown($event, option.value)"
              class="min-h-11 shrink-0 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc">{{ option.label }}</button>
          }
        </nav>
      <section id="expenses-panel" role="tabpanel" tabindex="0" [attr.aria-labelledby]="'expense-tab-' + tab()"
        [attr.aria-busy]="loading()">
        <h2 id="accounts-list-title" class="sr-only">Despesas cadastradas</h2>
        @if (loading()) {
          <div data-testid="expenses-loading" role="status" class="p-8 text-center text-sm text-slate-600">
            Carregando despesas...
          </div>
        }
        @if (error()) {
          <div role="alert" class="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{{ error() }}</p>
            <button type="button" data-testid="retry-expenses" class="min-h-11 underline" (click)="loadPage(page())">Tentar novamente</button>
          </div>
        }
        @if (!hasActiveProject()) {
          <p role="status" class="p-8 text-center text-sm text-slate-600">Selecione uma obra no menu para consultar as despesas.</p>
        }
        @if (hasActiveProject() && !loading() && !error() && !expenses().length) {
          <div [attr.data-testid]="isEmptyProject() ? 'empty-project' : 'empty-results'" class="p-8 text-center">
            <h3 class="text-lg font-semibold text-slate-900">
              {{ isEmptyProject() ? 'Nenhuma despesa cadastrada' : 'Nenhum resultado encontrado' }}
            </h3>
            <p class="mt-2 text-sm text-slate-600">
              {{ isEmptyProject() ? 'Cadastre sua primeira conta para acompanhar as despesas desta obra.' : 'Tente outra aba ou ajuste os filtros aplicados.' }}
            </p>
            @if (isEmptyProject()) {
              <a routerLink="/contas/nova" class="btn-oc-primary mt-4 inline-flex min-h-11 items-center" data-testid="empty-create-account">
                Cadastrar primeira conta
              </a>
            }
            @if (hasAppliedFilters()) {
              <button type="button" data-testid="clear-empty-filters" class="mt-4 min-h-11 rounded-md border border-slate-300 px-4 text-sm text-slate-700" (click)="clearFilters()">
                Limpar filtros
              </button>
            }
          </div>
        }
        @if (!loading() && !error() && expenses().length) {
          <div data-testid="expense-cards" class="space-y-4 p-4 sm:hidden">
            @for (expense of expenses(); track expense.id) {
              <article class="min-w-0 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <h3 class="break-words font-semibold text-slate-800">{{ expense.description }}</h3>
                <dl class="mt-3 space-y-2 break-words">
                  <div><dt class="font-medium">Categoria</dt><dd>{{ expense.categoryName }}</dd></div>
                  <div><dt class="font-medium">Fornecedor</dt><dd>{{ expense.supplier.name }}</dd></div>
                  <div><dt class="font-medium">Compra</dt><dd>{{ expense.purchaseDate | date:'dd/MM/yyyy' }}</dd></div>
                  <div><dt class="font-medium">Vencimento</dt><dd>{{ expense.dueDate ? (expense.dueDate | date:'dd/MM/yyyy') : '—' }}</dd></div>
                  <div><dt class="font-medium">Valor</dt><dd>{{ expense.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</dd></div>
                  <div><dt class="font-medium">Situação</dt><dd>{{ expense.paid ? 'Pago' : 'Pendente' }}</dd></div>
                </dl>
                <a class="mt-2 inline-flex min-h-11 items-center text-primary-oc underline" [routerLink]="['/despesas', expense.id]">Consultar</a>
              </article>
            }
          </div>
          <div class="hidden overflow-x-auto sm:block">
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
                    <td class="px-4 py-3"><a class="inline-flex min-h-11 items-center text-primary-oc underline" [routerLink]="['/despesas', expense.id]">Consultar</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        <nav data-testid="pagination" aria-label="Paginação" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <button type="button" class="min-h-11 px-2" [disabled]="page() === 0" (click)="loadPage(page() - 1)">Anterior</button>
          <span>Página {{ page() + 1 }} de {{ totalPages() }}</span>
          <button type="button" class="min-h-11 px-2" [disabled]="page() + 1 >= totalPages()" (click)="loadPage(page() + 1)">Próxima</button>
        </nav>
      </section>
      </div>
    </main>
  `,
})
export class AccountsPageComponent {
  private readonly activeProject = inject(ActiveProjectService);
  private readonly destroyRef = inject(DestroyRef);
  readonly hasActiveProject = computed(() => !!this.activeProject.activeProject());
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
  readonly loading = signal(false);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly tab = signal<ExpenseTab>('ALL');
  readonly sort = signal<ExpenseSort>('PURCHASE_DATE_DESC');
  readonly sortOptions: { value: ExpenseSort; label: string }[] = [
    { value: 'PURCHASE_DATE_DESC', label: 'Compra mais recente' },
    { value: 'PURCHASE_DATE_ASC', label: 'Compra mais antiga' },
    { value: 'AMOUNT_DESC', label: 'Maior valor' },
    { value: 'AMOUNT_ASC', label: 'Menor valor' },
  ];
  readonly tabs: { value: ExpenseTab; label: string }[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'PENDING', label: 'Pendentes' },
    { value: 'OVERDUE', label: 'Vencidas' },
    { value: 'PAID', label: 'Pagas' },
  ];
  readonly error = signal<string | null>(null);
  private readonly size = 15;
  private queryVersion = 0;

  constructor() {
    effect(() => {
      this.activeProject.contextVersion();
      untracked(() => {
        this.queryVersion++;
        this.filterForm.reset();
        this.validationAttempted.set(false);
        this.filters.set({});
        this.tab.set('ALL');
        this.sort.set('PURCHASE_DATE_DESC');
        this.page.set(0);
        this.totalPages.set(1);
        this.expenses.set([]);
        this.totals.set(null);
        this.error.set(null);
        this.loading.set(false);
        const project = this.activeProject.activeProject();
        if (project) this.loadPage(0, project.id);
      });
    });
  }

  loadPage(page: number, projectId = this.activeProject.activeProject()?.id): void {
    if (!projectId || page < 0) return;
    if (this.filterForm.invalid) { this.showInvalidFilters(); return; }
    const queryVersion = ++this.queryVersion;
    const contextVersion = this.activeProject.contextVersion();
    const isCurrent = () => !this.destroyRef.destroyed && this.queryVersion === queryVersion
      && this.activeProject.contextVersion() === contextVersion;
    this.page.set(page);
    this.error.set(null);
    this.expenses.set([]);
    this.totals.set(null);
    this.loading.set(true);
    this.expenseService.list(projectId, page, this.size, this.tab(), this.filters(), this.sort()).subscribe({
      next: response => {
        if (!isCurrent()) return;
        this.page.set(response.page);
        this.totalPages.set(Math.max(response.totalPages, 1));
        this.expenses.set(response.content);
        this.totals.set(response.totals);
        this.loading.set(false);
      },
      error: () => {
        if (!isCurrent()) return;
        this.loading.set(false);
        this.error.set('Não foi possível carregar as despesas.');
      },
    });
  }

  selectTab(tab: ExpenseTab): void {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    this.page.set(0);
    this.loadPage(0);
  }

  onTabKeydown(event: KeyboardEvent, tab: ExpenseTab): void {
    const index = this.tabs.findIndex(option => option.value === tab);
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % this.tabs.length; break;
      case 'ArrowLeft': next = (index + this.tabs.length - 1) % this.tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = this.tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    this.selectTab(this.tabs[next].value);
    const list = (event.currentTarget as HTMLElement).closest('[role="tablist"]');
    (list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next])?.focus();
  }

  selectSort(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value as ExpenseSort;
    if (this.sort() === sort) return;
    this.sort.set(sort);
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
    this.page.set(0);
    this.loadPage(0);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.validationAttempted.set(false);
    this.filters.set({});
    this.page.set(0);
    this.loadPage(0);
  }

  hasAppliedFilters(): boolean {
    const filters = this.filters();
    return !!filters.purchaseDateFrom || !!filters.purchaseDateTo || !!filters.dueDateFrom
      || !!filters.dueDateTo || !!filters.supplierId || !!filters.categoryIds?.length;
  }

  isEmptyProject(): boolean {
    return this.tab() === 'ALL' && !this.hasAppliedFilters();
  }

  private showInvalidFilters(): void {
    this.queryVersion++;
    this.loading.set(false);
    this.validationAttempted.set(true);
    this.filterForm.markAllAsTouched();
    this.expenses.set([]);
    this.totals.set(null);
    this.error.set(null);
  }

}
