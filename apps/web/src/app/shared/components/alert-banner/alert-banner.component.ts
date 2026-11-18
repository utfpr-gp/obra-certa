import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideCheckCircle } from '@lucide/angular';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [CommonModule, LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideCheckCircle],
  templateUrl: './alert-banner.component.html',
  styleUrl: './alert-banner.component.css'
})
export class AlertBannerComponent {
  type = input<'danger' | 'warning' | 'info' | 'success'>('danger');
  title = input.required<string>();
  message = input.required<string>();
  actionLabel = input<string>();
  dismissLabel = input<string>();

  actionClick = output<void>();
  dismissClick = output<void>();

  onAction(): void {
    this.actionClick.emit();
  }
}
