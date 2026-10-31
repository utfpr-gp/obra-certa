import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { HomePage } from './features/home-page/home-page';
import { BudgetsPageComponent } from './features/budgets-page/budgets-page.component';
import { authGuard } from './core/guards/auth-guard';

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

