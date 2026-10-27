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

export const routes: Routes = [
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
      { path: 'contas', component: AccountsPageComponent },
      { path: 'despesas/nova', component: ExpenseFormComponent },
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
];

