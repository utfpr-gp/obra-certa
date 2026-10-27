import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';

@Component({
  selector: 'app-expense-detail', standalone: true, imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 class="text-2xl font-bold mb-6">Despesa</h1>
      @if (loading()) { <p role="status">Carregando despesa…</p> }
      @if (errorMessage()) { <p class="alert alert-error" role="alert">{{ errorMessage() }}</p> }
      @if (expense(); as expense) {
        <article class="card bg-base-100 border border-base-300 p-6">
          <h2 class="text-xl font-semibold">{{ expense.description }}</h2>
          <span class="badge badge-success my-3">{{ expense.paid ? 'Quitada' : 'Pendente' }}</span>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><dt class="font-semibold">Categoria</dt><dd>{{ expense.categoryName }}</dd></div>
            <div><dt class="font-semibold">Data</dt><dd>{{ date(expense.purchaseDate) }}</dd></div>
            <div><dt class="font-semibold">Fornecedor</dt><dd>{{ expense.supplier.name }}</dd></div>
            <div><dt class="font-semibold">CNPJ</dt><dd>{{ expense.supplier.document }}</dd></div>
            @if (expense.quantity !== null) {
              <div><dt class="font-semibold">Quantidade</dt><dd>{{ expense.quantity }}</dd></div>
              <div><dt class="font-semibold">Valor unitário</dt><dd>{{ money(expense.unitPrice!) }}</dd></div>
            }
            <div><dt class="font-semibold">Total</dt><dd class="text-xl">{{ money(expense.totalPrice) }}</dd></div>
          </dl>
        </article>
        <p class="my-4">Despesa salva. Você pode voltar a esta consulta pelo endereço desta página.</p>
      }
      <a class="btn btn-primary mt-4" routerLink="/despesas/nova">Nova despesa</a>
      <a class="btn btn-ghost mt-4" routerLink="/orcamentos">Ver orçamento</a>
    </section>
  `,
})
export class ExpenseDetailComponent {
  private readonly expenses = inject(ExpenseService);
  readonly expense = signal<ExpenseResponse | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
    this.expenses.get(id).pipe(takeUntilDestroyed()).subscribe({
      next: expense => { this.expense.set(expense); this.loading.set(false); },
      error: () => { this.errorMessage.set('Despesa não encontrada ou indisponível.'); this.loading.set(false); },
    });
  }
  money(value: number): string { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value); }
  date(value: string): string { return value.split('-').reverse().join('/'); }
}
