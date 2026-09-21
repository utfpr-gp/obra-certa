import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaOrcamento } from '../../../core/models/obra.model';

@Component({
  selector: 'app-category-progress-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-progress-card.component.html',
  styleUrl: './category-progress-card.component.css'
})
export class CategoryProgressCardComponent {
  category = input.required<CategoriaOrcamento>();

  formatBrlShort(value: number): string {
    if (value >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    }
    if (value >= 1_000) {
      return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  }
}
