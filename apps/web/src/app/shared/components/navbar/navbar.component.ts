import { Component, HostListener, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObraMockService } from '../../../core/services/obra-mock.service';
import { Auth } from '../../../core/services/auth';
import { Obra } from '../../../core/models/obra.model';
import {
  LucideHome,
  LucideChevronDown,
  LucideMenu,
  LucidePlus,
  LucideX,
  LucideCheck,
  LucideLogOut
} from '@lucide/angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    LucideHome,
    LucideChevronDown,
    LucideMenu,
    LucidePlus,
    LucideX,
    LucideCheck,
    LucideLogOut
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private obraService = inject(ObraMockService);
  private authService = inject(Auth);

  toggleSidebar = output<void>();

  // State
  deskDropdownOpen = signal<boolean>(false);
  mobileSheetOpen = signal<boolean>(false);
  userMenuOpen = signal<boolean>(false);

  // Data from Service
  readonly obras = this.obraService.obras;
  readonly activeObra = this.obraService.activeObra;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }

  toggleDeskDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.deskDropdownOpen.update((v) => !v);
    this.userMenuOpen.set(false);
  }

  openMobileSheet(): void {
    this.mobileSheetOpen.set(true);
  }

  closeMobileSheet(): void {
    this.mobileSheetOpen.set(false);
  }

  toggleUserMenu(event?: Event): void {
    if (event) event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
    this.deskDropdownOpen.set(false);
  }

  closeAll(): void {
    this.deskDropdownOpen.set(false);
    this.mobileSheetOpen.set(false);
    this.userMenuOpen.set(false);
  }

  selectObra(obra: Obra, event?: Event): void {
    if (event) event.stopPropagation();
    this.obraService.selectObra(obra.id);
    this.closeAll();
  }

  formatBrl(val: number): string {
    return this.obraService.formatBrlShort(val);
  }

  getProgressBarColor(percent: number): string {
    if (percent >= 95) return '#EF4444';
    if (percent >= 80) return '#F59E0B';
    return '#007A80';
  }

  onMenuClick(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
