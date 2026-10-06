import { Component, HostListener, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideTriangleAlert, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideTriangleAlert, LucideX],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent {
  isOpen = input.required<boolean>();
  title = input.required<string>();
  description = input.required<string>();
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');
  isDestructive = input<boolean>(true);

  confirm = output<void>();
  cancel = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
