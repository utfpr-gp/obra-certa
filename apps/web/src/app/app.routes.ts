import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { HomePage } from './features/home-page/home-page';
import { BudgetsPageComponent } from './features/budgets-page/budgets-page.component';
import { authGuard } from './core/guards/auth-guard';
import { ExpenseFormComponent } from './features/expenses/expense-form.component';
import { ExpenseDetailComponent } from './features/expenses/expense-detail.component';
import { AccountsPageComponent } from './features/expenses/accounts-page.component';
import { ReportsPageComponent } from './features/reports/reports-page.component';
import { NotFoundPage } from './features/not-found/not-found-page';
import { PasswordRecovery } from './features/auth/password-recovery/password-recovery';
import { PasswordReset } from './features/auth/password-recovery/password-reset';

export const routes: Routes = [
  { path: 'recuperar-senha', component: PasswordRecovery },
  { path: 'redefinir-senha', component: PasswordReset },
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'relatorios', component: ReportsPageComponent },
      { path: 'contas', component: AccountsPageComponent },
      { path: 'contas/nova', component: ExpenseFormComponent },
      { path: 'despesas/nova', redirectTo: 'contas/nova', pathMatch: 'full' },
      { path: 'despesas/:id', component: ExpenseDetailComponent },
      {
        path: 'home',
        component: HomePage,
      },
      {
        path: 'orcamentos',
        component: BudgetsPageComponent,
      },
    ],
  },
  { path: '**', component: NotFoundPage },
];

