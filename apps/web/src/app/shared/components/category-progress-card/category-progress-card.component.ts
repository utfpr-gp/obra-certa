import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaOrcamento } from '../../../core/models/obra.model';
import { formatPercentage } from '../../utils/format-percentage';

@Component({
  selector: 'app-category-progress-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-progress-card.component.html',
  styleUrl: './category-progress-card.component.css'
})
export class CategoryProgressCardComponent {
  category = input.required<CategoriaOrcamento>();
  readonly progressLabel = computed(() => {
    const percent = this.category().percentual;
    return percent === null ? 'Sem orçamento' : formatPercentage(percent);
  });
  readonly progressWidth = computed(() => Math.min(this.category().percentual ?? 0, 100));

  private readonly compactNumber = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  private readonly amountNumber = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  });

  formatBrlShort(value: number): string {
    if (value >= 1_000_000) {
      return `R$ ${this.compactNumber.format(value / 1_000_000)}M`;
    }
    if (value >= 1_000) {
      return `R$ ${this.compactNumber.format(value / 1_000)}k`;
    }
    return `R$ ${this.amountNumber.format(value)}`;
  }
}
