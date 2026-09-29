import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ObraMockService } from '../../core/services/obra-mock.service';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { RadialGaugeComponent } from '../../shared/components/radial-gauge/radial-gauge.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CategoryProgressCardComponent } from '../../shared/components/category-progress-card/category-progress-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  LucideHome,
  LucidePlusCircle,
  LucideClock,
  LucideCheckCircle,
  LucideArrowRight
} from '@lucide/angular';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AlertBannerComponent,
    RadialGaugeComponent,
    KpiCardComponent,
    CategoryProgressCardComponent,
    StatusBadgeComponent,
    LucideHome,
    LucidePlusCircle,
    LucideClock,
    LucideCheckCircle,
    LucideArrowRight
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  private obraService = inject(ObraMockService);

  readonly activeObra = this.obraService.activeObra;
  readonly riskCategories = this.obraService.riskCategories;

  readonly firstRiskCategory = computed(() => {
    const list = this.riskCategories();
    return list.length > 0 ? list[0] : null;
  });

  formatBrl(value: number): string {
    return this.obraService.formatBrl(value);
  }

  formatBrlShort(value: number): string {
    return this.obraService.formatBrlShort(value);
  }
}
