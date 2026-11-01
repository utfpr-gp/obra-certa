import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
      <section aria-labelledby="accounts-list-title" class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 id="accounts-list-title" class="sr-only">Despesas cadastradas</h2>
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
  readonly expenses = signal<ExpenseResponse[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly error = signal<string | null>(null);
  private readonly size = 15;
  private lastProjectId: string | undefined;
  private lastPage = 0;

  constructor() {
    effect(() => {
      const project = this.activeProject.activeProject();
      if (project) this.loadPage(0, project.id);
      else {
        this.expenses.set([]);
        this.error.set(null);
      }
    });
  }

  loadPage(page: number, projectId = this.activeProject.activeProject()?.id): void {
    if (!projectId || page < 0) return;
    this.lastProjectId = projectId;
    this.lastPage = page;
    this.error.set(null);
    this.expenses.set([]);
    this.expenseService.list(projectId, page, this.size).subscribe({
      next: response => {
        if (this.activeProject.activeProject()?.id !== projectId) return;
        this.page.set(response.page);
        this.totalPages.set(Math.max(response.totalPages, 1));
        this.expenses.set(response.content);
      },
      error: () => {
        if (this.activeProject.activeProject()?.id !== projectId) return;
        this.error.set('Não foi possível carregar as despesas. Tente novamente.');
      },
    });
  }

  retry(): void {
    if (this.lastProjectId) this.loadPage(this.lastPage, this.lastProjectId);
  }
}
