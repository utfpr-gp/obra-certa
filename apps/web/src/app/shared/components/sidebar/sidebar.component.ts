import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
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
    { id: 'resumo', label: 'Resumo da Obra', icon: 'pie-chart', active: true },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'wallet' },
    { id: 'despesas', label: 'Despesas', icon: 'receipt' },
    { id: 'contas', label: 'Contas a Pagar', icon: 'calendar' },
    { id: 'fornecedores', label: 'Fornecedores', icon: 'users' },
    { id: 'relatorios', label: 'Relatórios', icon: 'file-text' }
  ];

  onClose(): void {
    this.closeDrawer.emit();
  }
}
