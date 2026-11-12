import { CommonModule } from '@angular/common';
import { LucidePlus, LucideCalendarClock, LucideCircleCheck, LucideReceipt, LucideSlidersHorizontal, LucideFileUp } from '@lucide/angular';
import { Component, computed, DestroyRef, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { forkJoin, timeout } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ExpenseCategory } from '../../core/models/expense-category.model';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse, ExpenseTab, ExpenseTotals, ExpenseFilters, ExpenseSupplier, ExpenseSort } from '../../core/models/expense-registration.model';
import { PaymentTarget } from '../../core/models/payment.model';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';
import { NfeImportDialogComponent } from './nfe-import/nfe-import-dialog.component';
import { formatCivilDate as formatCivilDateValue } from '../../shared/utils/civil-date';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PaymentModalComponent, NfeImportDialogComponent, LucidePlus, LucideCalendarClock, LucideCircleCheck, LucideReceipt, LucideSlidersHorizontal, LucideFileUp],
  template: `
    <main class="min-w-0 p-4 md:p-6 lg:p-8 space-y-6">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-slate-800">Contas a Pagar</h1>
          <p class="mt-1 text-sm text-slate-500">Acompanhe os compromissos da obra e mantenha o histórico de quitações.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a routerLink="/contas/nova" data-testid="create-account"
            class="btn-oc-primary inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc">
            <svg lucidePlus [size]="18" aria-hidden="true" />Cadastrar conta
          </a>
          <button type="button" data-testid="import-nfe" (click)="openNfeImport()" [disabled]="!hasActiveProject()"
            class="btn-oc-secondary inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 sm:w-auto disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc">
            <svg lucideFileUp [size]="18" aria-hidden="true" />Importar NF-e
          </button>
        </div>
      </header>
      @if (hasActiveProject()) {
        <section aria-label="Totalizadores das despesas" [attr.aria-busy]="loading()" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article data-testid="total-pending" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3"><h2 class="text-xs font-medium text-slate-500">Total a Pagar</h2><svg lucideCalendarClock [size]="20" class="text-primary-oc" aria-hidden="true" /></div>
            <p class="mt-2 text-2xl font-bold text-primary-oc">
              @if (totals(); as totals) { {{ totals.totalPending | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} }
              @else { <span class="account-total-placeholder" [class.account-skeleton]="loading()"><span class="sr-only">{{ loading() ? 'Carregando total a pagar' : 'Total a pagar indisponível' }}</span><span aria-hidden="true">—</span></span> }
            </p>
            <p class="mt-2 text-xs text-slate-500">Compromissos pendentes no recorte atual</p>
          </article>
          <article data-testid="total-paid" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3"><h2 class="text-xs font-medium text-slate-500">Total Pago</h2><svg lucideCircleCheck [size]="20" class="text-emerald-600" aria-hidden="true" /></div>
            <p class="mt-2 text-2xl font-bold text-slate-800">
              @if (totals(); as totals) { {{ totals.totalPaid | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} }
              @else { <span class="account-total-placeholder" [class.account-skeleton]="loading()"><span class="sr-only">{{ loading() ? 'Carregando total pago' : 'Total pago indisponível' }}</span><span aria-hidden="true">—</span></span> }
            </p>
            <p class="mt-2 text-xs text-slate-500">Despesas quitadas no recorte atual</p>
          </article>
          <article data-testid="total-general" class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3"><h2 class="text-xs font-medium text-slate-500">Total Geral</h2><svg lucideReceipt [size]="20" class="text-slate-500" aria-hidden="true" /></div>
            <p class="mt-2 text-2xl font-bold text-slate-800">
              @if (totals(); as totals) { {{ totals.totalGeneral | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} }
              @else { <span class="account-total-placeholder" [class.account-skeleton]="loading()"><span class="sr-only">{{ loading() ? 'Carregando total geral' : 'Total geral indisponível' }}</span><span aria-hidden="true">—</span></span> }
            </p>
            <p class="mt-2 text-xs text-slate-500">Soma dos valores pagos e a pagar</p>
          </article>
        </section>
      }
      <section aria-labelledby="accounts-list-title" class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="px-4 pt-5 md:px-6 md:pt-6">
          <h2 id="accounts-list-title" class="text-xl font-semibold text-slate-800">Compromissos e histórico</h2>
          <p class="mt-1 text-xs text-slate-500">Consulte as despesas e acompanhe a situação dos pagamentos.</p>
        </div>
        <nav data-testid="expense-tabs" role="tablist" aria-label="Situação das despesas" class="mt-4 grid grid-cols-2 border-b border-slate-200 px-4 sm:flex md:px-6">
          @for (option of tabs; track option.value) {
            <button type="button" [attr.data-testid]="'expense-tab-' + option.value"
              role="tab" [attr.id]="'expense-tab-' + option.value"
              aria-controls="expenses-panel"
              [attr.aria-selected]="tab() === option.value" [attr.tabindex]="tab() === option.value ? 0 : -1"
              [class.account-tab-active]="tab() === option.value"
              (click)="selectTab(option.value)" (keydown)="onTabKeydown($event, option.value)"
              class="account-tab min-h-11 shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc">{{ option.label }}</button>
          }
        </nav>
        <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:flex-wrap sm:items-start md:px-6">
      <div class="flex min-w-0 flex-col gap-1 sm:ml-auto sm:w-64">
        <label for="expense-sort" class="text-sm font-medium text-slate-800">Ordenar por</label>
        <select id="expense-sort" data-testid="expense-sort" [value]="sort()" (change)="selectSort($event)"
          class="min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:w-auto">
          @for (option of sortOptions; track option.value) { <option [value]="option.value">{{ option.label }}</option> }
        </select>
      </div>
      <details data-testid="filters-panel" class="min-w-0 sm:order-first sm:flex-1"
        (toggle)="onFiltersToggle($event)">
        <summary class="min-h-11 w-fit list-none cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 [&::-webkit-details-marker]:hidden"><svg lucideSlidersHorizontal [size]="16" class="mr-2 inline-block" aria-hidden="true" />Filtros</summary>
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
        </div>
      <section id="expenses-panel" role="tabpanel" tabindex="0" [attr.aria-labelledby]="'expense-tab-' + tab()"
        [attr.aria-busy]="loading()">
        @if (settlement(); as settled) {
          <p data-testid="payment-settled-notice" role="status" class="m-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
            Pagamento confirmado para {{ settled.description }}@if (settled.paidAt) { em {{ formatCivilDate(settled.paidAt) }}}.
          </p>
        }
        @if (nfeImportNotice(); as notice) {
          <p data-testid="nfe-import-notice" role="status" class="m-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{{ notice }}</p>
        }
        <div #expenseResults class="relative @container" [style.min-height.px]="loading() ? resultsHeight() : null">
        @if (loading()) {
          <div data-testid="expenses-loading" role="status" class="absolute right-4 top-1 z-10 rounded-md bg-white px-2 text-xs text-slate-600">
            Carregando despesas... Dados indisponíveis durante a atualização.
          </div>
        }
        @if (error()) {
          <div role="alert" class="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{{ settlementRefreshPending() ? 'A quitação ocorreu, mas a atualização da consulta falhou. Consulte novamente.' : error() }}</p>
            <button type="button" data-testid="retry-expenses" class="min-h-11 underline" (click)="retryLoad()">{{ settlementRefreshPending() ? 'Consultar novamente' : 'Tentar novamente' }}</button>
          </div>
        }
        @if (!hasActiveProject()) {
          <p role="status" class="p-8 text-center text-sm text-slate-600">Selecione uma obra no menu para consultar as despesas.</p>
        }
        @if (hasActiveProject() && !loading() && !error() && !expenses().length && !filterForm.invalid) {
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
        <ng-template #cellPlaceholder><span aria-hidden="true" class="account-skeleton account-cell-placeholder"></span></ng-template>
        @if (hasActiveProject() && !error() && (loading() || expenses().length)) {
          <div data-testid="expense-cards" class="space-y-4 p-4 @min-[64rem]:hidden">
            @for (expense of displayedRows(); track $index) {
              <article [style.height.px]="loading() ? rowDimensions()[$index]?.mobile : null" class="min-w-0 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                <h3 class="[overflow-wrap:anywhere] font-semibold text-slate-800">@if (expense) { {{ expense.description }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</h3>
                <dl class="mt-3 space-y-2 [overflow-wrap:anywhere]">
                  <div><dt class="font-medium">Categoria</dt><dd>@if (expense) { {{ expense.categoryName }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</dd></div>
                  <div><dt class="font-medium">Fornecedor</dt><dd>@if (expense) { {{ expense.supplier.name }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</dd></div>
                  <div><dt class="font-medium">Compra</dt><dd>@if (expense) { {{ expense.purchaseDate | date:'dd/MM/yyyy' }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</dd></div>
                  <div><dt class="font-medium">Vencimento</dt><dd>@if (expense) { {{ expense.dueDate ? (expense.dueDate | date:'dd/MM/yyyy') : '—' }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</dd></div>
                  <div><dt class="font-medium">Valor</dt><dd class="font-semibold tabular-nums text-slate-800">@if (expense) { {{ expense.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</dd></div>
                  <div><dt class="font-medium">Situação</dt><dd>@if (expense) { <span class="account-status" [class.account-status-paid]="expense.paid" [class.account-status-pending]="!expense.paid">{{ expense.paid ? 'Pago' : 'Pendente' }}</span> } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</dd></div>
                </dl>
                @if (expense) {
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <a class="btn-oc-outline h-11 min-h-11 px-3 py-2 text-xs" [routerLink]="['/despesas', expense.id]">Ver detalhes</a>
                    @if (!expense.paid) {
                      <button type="button" data-testid="mark-expense-paid" class="btn-oc-outline h-11 min-h-11 px-3 py-2 text-xs" (click)="openPayment(expense)">Marcar como Pago</button>
                    }
                  </div>
                }
                @else { <span class="mt-2 inline-flex min-h-11 items-center"><ng-container [ngTemplateOutlet]="cellPlaceholder" /></span> }
              </article>
            }
          </div>
          <div class="hidden overflow-x-auto @min-[64rem]:block">
            <table [style.table-layout]="loading() ? 'fixed' : null" class="w-full text-left text-sm [overflow-wrap:anywhere]">
              <thead class="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  @for (heading of columnHeadings; track heading; let index = $index) {
                    <th [style.width.px]="loading() ? columnWidths()[index] : null" [class.text-right]="index === 5" class="px-4 py-3">{{ heading }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (expense of displayedRows(); track $index) {
                  <tr [style.height.px]="loading() ? rowDimensions()[$index]?.desktop : null" class="border-b border-slate-200/70 text-slate-600 hover:bg-slate-50/60">
                    <td class="px-4 py-3 font-semibold text-slate-800">@if (expense) { {{ expense.description }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="px-4 py-3">@if (expense) { {{ expense.categoryName }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="px-4 py-3">@if (expense) { {{ expense.supplier.name }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="px-4 py-3">@if (expense) { {{ expense.purchaseDate | date:'dd/MM/yyyy' }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="px-4 py-3">@if (expense) { {{ expense.dueDate ? (expense.dueDate | date:'dd/MM/yyyy') : '—' }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-800">@if (expense) { {{ expense.totalPrice | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="px-4 py-3">@if (expense) { <span class="account-status" [class.account-status-paid]="expense.paid" [class.account-status-pending]="!expense.paid">{{ expense.paid ? 'Pago' : 'Pendente' }}</span> } @else { <ng-container [ngTemplateOutlet]="cellPlaceholder" /> }</td>
                    <td class="px-4 py-3">
                      @if (expense) {
                        <div class="flex flex-wrap items-center gap-2">
                          <a class="btn-oc-outline h-11 min-h-11 px-3 py-2 text-xs" [routerLink]="['/despesas', expense.id]">Ver detalhes</a>
                          @if (!expense.paid) {
                            <button type="button" data-testid="mark-expense-paid" class="btn-oc-outline h-11 min-h-11 px-3 py-2 text-xs" (click)="openPayment(expense)">Marcar como Pago</button>
                          }
                        </div>
                      } @else { <span class="inline-flex min-h-11 items-center"><ng-container [ngTemplateOutlet]="cellPlaceholder" /></span> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        </div>
        <nav data-testid="pagination" aria-label="Paginação" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <button type="button" class="min-h-11 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" [disabled]="page() === 0" (click)="goToPage(page() - 1)">Anterior</button>
          <div class="text-center text-xs text-slate-500">
            @if (loading()) { <span>Atualizando página...</span><span class="mt-1 block">Aguarde os resultados</span> }
            @else {
              <span>Página {{ page() + 1 }} de {{ totalPages() }}</span>
              @if (totalElements() !== null) { <span class="mt-1 block">{{ totalElements() }} {{ totalElements() === 1 ? 'registro' : 'registros' }} no resultado</span> }
            }
          </div>
          <button type="button" class="min-h-11 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" [disabled]="page() + 1 >= totalPages()" (click)="goToPage(page() + 1)">Próxima</button>
        </nav>
      </section>
      </section>
      @if (selectedPayment(); as selection) {
        <app-payment-modal [target]="selection.target" [projectId]="selection.projectId"
          (closed)="closePayment()" (settled)="onPaymentSettled($event)" />
      }
      @if (selectedNfeImport(); as selection) {
        <app-nfe-import-dialog [projectId]="selection.projectId" (closed)="closeNfeImport()" (imported)="onNfeImported($event)" />
      }
    </main>
  `,
  styles: `
    .account-total-placeholder { display: block; height: 2rem; width: 10rem; max-width: 100%; border-radius: 0.375rem; }
    .account-skeleton { background: #e2e8f0; color: transparent; }
    .account-cell-placeholder { display: inline-block; height: 0.75rem; width: 5rem; max-width: 100%; border-radius: 0.375rem; }
    .account-tab { transition: background-color 150ms, color 150ms; }
    .account-tab:hover { background: #f8fafc; color: #007a80; }
    .account-tab-active { border-bottom-color: #007a80; background: #e6f2f3; color: #007a80; font-weight: 600; }
    .account-status { display: inline-flex; align-items: center; border-radius: 9999px; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 500; }
    .account-status-paid { background: #d1fae5; color: #065f46; }
    .account-status-pending { background: #fef3c7; color: #92400e; }
  `,
})
export class AccountsPageComponent {
  private readonly activeProject = inject(ActiveProjectService);
  private readonly route = inject(ActivatedRoute);
  private expenseShortcutPending = true;
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
  readonly totalElements = signal<number | null>(null);
  private readonly projectHasExpenses = signal<boolean | null>(null);
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
  readonly referenceDate = signal<string | null>(null);
  readonly settlement = signal<ExpenseResponse | null>(null);
  readonly settlementRefreshPending = signal(false);
  readonly nfeImportNotice = signal<string | null>(null);
  private nfeImportRefreshPending = false;
  private readonly paymentSelection = signal<{ projectId: string; context: number; target: PaymentTarget } | null>(null);
  readonly selectedPayment = computed(() => {
    const selection = this.paymentSelection();
    return selection?.context === this.activeProject.contextVersion()
      && selection.projectId === this.activeProject.activeProject()?.id ? selection : null;
  });
  private readonly nfeImportSelection = signal<{ projectId: string; context: number } | null>(null);
  readonly selectedNfeImport = computed(() => {
    const selection = this.nfeImportSelection();
    return selection?.context === this.activeProject.contextVersion()
      && selection.projectId === this.activeProject.activeProject()?.id ? selection : null;
  });
  private readonly size = 15;
  private queryVersion = 0;
  private readonly expenseResults = viewChild<ElementRef<HTMLElement>>('expenseResults');
  readonly resultsHeight = signal(192);
  readonly columnHeadings = ['Descrição', 'Categoria', 'Fornecedor', 'Compra', 'Vencimento', 'Valor', 'Situação', 'Ações'];
  readonly columnWidths = signal<number[]>([]);
  readonly rowDimensions = signal<{ desktop: number; mobile: number }[]>([]);
  readonly displayedRows = computed<(ExpenseResponse | null)[]>(() => this.loading()
    ? Array.from({ length: Math.max(this.rowDimensions().length, 1) }, () => null)
    : this.expenses());

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
        this.totalElements.set(null);
        this.projectHasExpenses.set(null);
        this.error.set(null);
        this.referenceDate.set(null);
        this.settlement.set(null);
        this.settlementRefreshPending.set(false);
        this.paymentSelection.set(null);
        this.nfeImportSelection.set(null);
        this.nfeImportNotice.set(null);
        this.nfeImportRefreshPending = false;
        this.loading.set(false);
        const project = this.activeProject.activeProject();
        if (project) {
          if (this.expenseShortcutPending) {
            this.expenseShortcutPending = false;
            const params = this.route.snapshot.queryParamMap;
            const categoryId = params.get('categoryId');
            if (categoryId && params.get('projectId') === project.id) {
              const categoryIds = [categoryId];
              this.filterForm.controls.categoryIds.setValue(categoryIds);
              this.filters.set({ categoryIds });
            }
          }
          this.loadPage(0, { projectId: project.id });
        }
      });
    });
  }

  openPayment(expense: ExpenseResponse): void {
    const projectId = this.activeProject.activeProject()?.id;
    if (!projectId || expense.paid) return;
    this.settlement.set(null);
    this.settlementRefreshPending.set(false);
    this.paymentSelection.set({
      projectId,
      context: this.activeProject.contextVersion(),
      target: {
        expenseId: expense.id,
        description: expense.description,
        purchaseDate: expense.purchaseDate,
        totalPrice: expense.totalPrice,
        referenceDate: this.referenceDate() ?? expense.purchaseDate,
      },
    });
  }

  closePayment(): void { this.paymentSelection.set(null); }

  openNfeImport(): void {
    const projectId = this.activeProject.activeProject()?.id;
    if (!projectId) return;
    this.nfeImportSelection.set({ projectId, context: this.activeProject.contextVersion() });
  }

  closeNfeImport(): void { this.nfeImportSelection.set(null); }

  onNfeImported(created: ExpenseResponse[]): void {
    const selection = this.selectedNfeImport();
    if (!selection || !created.length || created.some(expense => expense.projectId !== selection.projectId)) return;
    this.nfeImportNotice.set(`${created.length} ${created.length === 1 ? 'linha criada' : 'linhas criadas'} na importação da NF-e.`);
    this.closeNfeImport();
    this.nfeImportRefreshPending = true;
    this.loadPage(this.page());
  }

  goToPage(page: number): void {
    this.nfeImportNotice.set(null);
    this.loadPage(page);
  }

  onPaymentSettled(expense: ExpenseResponse): void {
    const selection = this.selectedPayment();
    if (!selection || expense.projectId !== selection.projectId
      || expense.id !== selection.target.expenseId || !expense.paid) return;
    this.closePayment();
    this.settlement.set(expense);
    this.settlementRefreshPending.set(true);
    this.reloadAfterSettlement();
  }

  formatCivilDate(value: string): string {
    return formatCivilDateValue(value);
  }

  retryLoad(): void {
    if (this.settlementRefreshPending()) { this.reloadAfterSettlement(); return; }
    this.loadPage(this.page());
  }

  private reloadAfterSettlement(): void {
    this.loadPage(this.page(), { adjustEmptyPage: true });
  }

  loadPage(page: number, options: { projectId?: string; adjustEmptyPage?: boolean } = {}): void {
    // The import origin travels with this request: consumed once the request is actually issued.
    // Early exits keep the flag, so a later load still knows it comes from an import.
    const fromNfeImport = this.nfeImportRefreshPending;
    const projectId = options.projectId ?? this.activeProject.activeProject()?.id;
    if (!projectId || page < 0) return;
    if (this.filterForm.invalid && !options.adjustEmptyPage) { this.showInvalidFilters(); return; }
    this.nfeImportRefreshPending = false;
    const queryVersion = ++this.queryVersion;
    const contextVersion = this.activeProject.contextVersion();
    const isCurrent = () => !this.destroyRef.destroyed && this.queryVersion === queryVersion
      && this.activeProject.contextVersion() === contextVersion;
    const unfiltered = this.tab() === 'ALL' && !this.hasAppliedFilters();
    // Preserve only presentation dimensions, never the previous financial response.
    if (!this.loading()) {
      const results = this.expenseResults()?.nativeElement;
      const height = results?.getBoundingClientRect().height;
      if (height) this.resultsHeight.set(height);
      const desktopRows = results?.querySelectorAll('tbody tr');
      const mobileRows = results?.querySelectorAll('[data-testid="expense-cards"] article');
      this.rowDimensions.set(this.expenses().map((_, index) => ({
        desktop: desktopRows?.[index]?.getBoundingClientRect().height ?? 0,
        mobile: mobileRows?.[index]?.getBoundingClientRect().height ?? 0,
      })));
      this.columnWidths.set(Array.from(results?.querySelectorAll('thead th') ?? [], column => column.getBoundingClientRect().width));
    }
    this.page.set(page);
    this.error.set(null);
    this.expenses.set([]);
    this.totals.set(null);
    this.totalElements.set(null);
    this.loading.set(true);
    this.expenseService.list(projectId, page, this.size, this.tab(), this.filters(), this.sort()).pipe(timeout(30_000)).subscribe({
      next: response => {
        if (!isCurrent()) return;
        const lastPage = Math.max(response.totalPages - 1, 0);
        if (options.adjustEmptyPage && response.content.length === 0 && response.page > lastPage) {
          this.loadPage(lastPage, { projectId, adjustEmptyPage: true });
          return;
        }
        this.page.set(response.page);
        this.totalPages.set(Math.max(response.totalPages, 1));
        this.expenses.set(response.content);
        this.totalElements.set(response.totalElements ?? null);
        if (unfiltered) this.projectHasExpenses.set((response.totalElements ?? 0) > 0);
        this.totals.set(response.totals);
        this.referenceDate.set(response.referenceDate ?? null);
        this.loading.set(false);
        this.settlementRefreshPending.set(false);
      },
      error: () => {
        if (!isCurrent()) return;
        this.loading.set(false);
        this.error.set(fromNfeImport
          ? 'Importou, mas a consulta falhou. Consulte novamente as despesas.'
          : 'Não foi possível carregar as despesas.');
      },
    });
  }

  selectTab(tab: ExpenseTab): void {
    if (this.tab() === tab) return;
    this.nfeImportNotice.set(null);
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
    this.nfeImportNotice.set(null);
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
    this.nfeImportNotice.set(null);
    this.filters.set(filters);
    this.page.set(0);
    this.loadPage(0);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.validationAttempted.set(false);
    this.nfeImportNotice.set(null);
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
    return this.projectHasExpenses() === false;
  }

  private showInvalidFilters(): void {
    this.queryVersion++;
    this.loading.set(false);
    this.validationAttempted.set(true);
    this.filterForm.markAllAsTouched();
    this.expenses.set([]);
    this.totals.set(null);
    this.totalElements.set(null);
    this.error.set(null);
  }

}
