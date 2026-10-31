import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [RouterLink],
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
    </main>
  `,
})
export class AccountsPageComponent {}
