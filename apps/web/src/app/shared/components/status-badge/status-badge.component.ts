import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeStatus =
  | 'pago'
  | 'pendente'
  | 'vencido'
  | 'em_risco'
  | 'hoje'
  | 'amanha'
  | 'futuro'
  | 'atrasado';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  status = input.required<BadgeStatus>();
  label = input<string>();

  readonly displayLabel = computed(() => {
    if (this.label()) return this.label();
    switch (this.status()) {
      case 'pago': return 'Pago';
      case 'pendente': return 'Pendente';
      case 'vencido':
      case 'atrasado': return 'Atrasado';
      case 'em_risco': return 'Em Risco';
      case 'hoje': return 'Vence Hoje';
      case 'amanha': return 'Vence Amanhã';
      case 'futuro': return 'A Vencer';
      default: return '';
    }
  });

  readonly badgeClasses = computed(() => {
    switch (this.status()) {
      case 'pago':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pendente':
      case 'amanha':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'vencido':
      case 'atrasado':
      case 'em_risco':
      case 'hoje':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'futuro':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  });
}
