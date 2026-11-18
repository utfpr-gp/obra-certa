import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <main class="grid min-h-dvh place-items-center bg-slate-50 px-4 py-8">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
        <h1 class="text-2xl font-semibold text-slate-900">404 — Página não encontrada</h1>
        <p class="mt-3 text-slate-600">Confira o endereço ou volte para o login.</p>
        <a routerLink="/login" class="btn mt-6 border-0 bg-primary-oc text-white hover:bg-primary-oc-hover">
          Voltar para o login
        </a>
      </div>
    </main>
  `,
})
export class NotFoundPage {}
