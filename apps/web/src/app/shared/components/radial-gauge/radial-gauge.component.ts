import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-radial-gauge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radial-gauge.component.html',
  styleUrl: './radial-gauge.component.css'
})
export class RadialGaugeComponent {
  percent = input.required<number>();
  currentValue = input.required<string>();
  totalValue = input.required<string>();
  label = input<string>('Total Gasto');

  readonly normalizedPercent = computed(() => {
    const p = this.percent();
    return p > 100 ? 100 : p < 0 ? 0 : p;
  });

  readonly strokeColor = computed(() => {
    const p = this.percent();
    if (p >= 95) return '#EF4444';
    if (p >= 80) return '#F59E0B';
    return '#007A80';
  });

  readonly strokeDashoffset = computed(() => {
    const circumference = 251.2; // 2 * PI * r (r = 40)
    return circumference - (circumference * this.normalizedPercent()) / 100;
  });
}
