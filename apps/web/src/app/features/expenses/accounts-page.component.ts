import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-5xl p-4 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-800">Contas a pagar</h1>
        <a routerLink="/despesas/nova" class="btn btn-primary" data-testid="create-account">Cadastrar conta</a>
      </div>
    </section>
  `,
})
export class AccountsPageComponent {}
