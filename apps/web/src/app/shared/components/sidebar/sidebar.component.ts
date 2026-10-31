import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucidePieChart,
  LucideWallet,
  LucideReceipt,
  LucideCalendar,
  LucideUsers,
  LucideFileText,
  LucideX
} from '@lucide/angular';

export interface NavMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucidePieChart,
    LucideWallet,
    LucideReceipt,
    LucideCalendar,
    LucideUsers,
    LucideFileText,
    LucideX
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isOpen = input<boolean>(false);
  closeDrawer = output<void>();

  navItems: NavMenuItem[] = [
    { id: 'resumo', label: 'Resumo da Obra', icon: 'pie-chart', route: '/home' },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'wallet', route: '/orcamentos' },
    { id: 'contas', label: 'Contas a Pagar', icon: 'calendar', route: '/contas' },
    { id: 'fornecedores', label: 'Fornecedores', icon: 'users', route: '/fornecedores' },
    { id: 'relatorios', label: 'Relatórios', icon: 'file-text', route: '/relatorios' }
  ];

  onClose(): void {
    this.closeDrawer.emit();
  }
}
