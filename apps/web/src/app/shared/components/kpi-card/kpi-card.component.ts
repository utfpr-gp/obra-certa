import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucidePiggyBank,
  LucideCalendarClock,
  LucideTriangleAlert,
  LucideWallet,
  LucideReceipt,
  LucideUsers,
  LucideFileText,
  LucidePieChart,
  LucideCoins
} from '@lucide/angular';

export type KpiIconType =
  | 'piggy-bank'
  | 'calendar-clock'
  | 'triangle-alert'
  | 'wallet'
  | 'receipt'
  | 'users'
  | 'file-text'
  | 'pie-chart'
  | 'coins';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [
    CommonModule,
    LucidePiggyBank,
    LucideCalendarClock,
    LucideTriangleAlert,
    LucideWallet,
    LucideReceipt,
    LucideUsers,
    LucideFileText,
    LucidePieChart,
    LucideCoins
  ],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css'
})
export class KpiCardComponent {
  title = input.required<string>();
  value = input.required<string>();
  subtitle = input<string>();
  icon = input.required<KpiIconType>();
  iconBgClass = input<string>('bg-amber-100/70 text-amber-700');
  valueClass = input<string>('text-slate-900');
}
