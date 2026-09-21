import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObraMockService } from '../../core/services/obra-mock.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { RadialGaugeComponent } from '../../shared/components/radial-gauge/radial-gauge.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CategoryProgressCardComponent } from '../../shared/components/category-progress-card/category-progress-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  LucideHome,
  LucidePlusCircle,
  LucideClock,
  LucideCheckCircle
} from '@lucide/angular';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    SidebarComponent,
    AlertBannerComponent,
    RadialGaugeComponent,
    KpiCardComponent,
    CategoryProgressCardComponent,
    StatusBadgeComponent,
    LucideHome,
    LucidePlusCircle,
    LucideClock,
    LucideCheckCircle
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  private obraService = inject(ObraMockService);

  sidebarOpen = signal<boolean>(false);

  readonly activeObra = this.obraService.activeObra;
  readonly riskCategories = this.obraService.riskCategories;

  readonly firstRiskCategory = computed(() => {
    const list = this.riskCategories();
    return list.length > 0 ? list[0] : null;
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  formatBrl(value: number): string {
    return this.obraService.formatBrl(value);
  }

  formatBrlShort(value: number): string {
    return this.obraService.formatBrlShort(value);
  }
}
