import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideX } from '@lucide/angular';
import { NfePreview } from '../../../core/models/nfe-import.model';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { NfeImportService } from '../../../core/services/nfe-import.service';
import { formatCivilDate } from '../../../shared/utils/civil-date';

type NfeImportPhase = 'idle' | 'sending' | 'preview' | 'invalid' | 'conflict' | 'failure';

@Component({
  selector: 'app-nfe-import-dialog',
  standalone: true,
  imports: [CommonModule, LucideX],
  templateUrl: './nfe-import-dialog.component.html',
  styleUrl: './nfe-import-dialog.component.css',
})
export class NfeImportDialogComponent implements AfterViewInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly closed = output<void>();

  private readonly nfeImport = inject(NfeImportService);
  private readonly activeProject = inject(ActiveProjectService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');

  // Captured once: A → B → A must still discard a response from before the transition.
  private readonly context = this.activeProject.contextVersion();
  private destroyed = false;
  private closedOnce = false;

  readonly phase = signal<NfeImportPhase>('idle');
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly preview = signal<NfePreview | null>(null);

  constructor() {
    effect(() => {
      this.activeProject.contextVersion();
      untracked(() => {
        if (this.destroyed || this.closedOnce) return;
        if (this.activeProject.activeProject()?.id !== this.projectId()) this.finish();
      });
    });
  }

  ngAfterViewInit(): void {
    this.dialog()?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.fileError.set(null);
    this.preview.set(null);
    this.errorMessage.set('');
    this.phase.set('idle');
  }

  send(): void {
    if (!this.current() || this.phase() === 'sending') return;
    const file = this.selectedFile();
    if (!file || file.size === 0) {
      this.fileError.set('Selecione um arquivo XML de NF-e para enviar.');
      return;
    }
    this.fileError.set(null);
    this.errorMessage.set('');
    this.preview.set(null);
    this.phase.set('sending');
    const projectId = this.projectId();
    this.nfeImport.preview(projectId, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (!this.current() || response.projectId !== projectId) return;
        this.preview.set(response);
        this.phase.set('preview');
      },
      error: (error: unknown) => {
        if (!this.current()) return;
        this.phase.set(this.failurePhase(error));
        this.errorMessage.set(this.failureMessage(error));
      },
    });
  }

  retry(): void {
    this.send();
  }

  goManual(): void {
    void this.router.navigate(['/contas/nova']);
    this.finish();
  }

  close(): void {
    this.finish();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.destroyed && !this.closedOnce) this.close();
  }

  formatDate(value: string): string {
    return formatCivilDate(value);
  }

  money(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  quantity(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value);
  }

  formatAccessKey(value: string): string {
    return (value.match(/.{1,4}/g) ?? []).join(' ');
  }

  private finish(): void {
    if (this.destroyed || this.closedOnce) return;
    this.closedOnce = true;
    this.closed.emit();
  }

  private current(): boolean {
    return !this.destroyed && !this.closedOnce
      && this.context === this.activeProject.contextVersion()
      && this.projectId() === this.activeProject.activeProject()?.id;
  }

  private failurePhase(error: unknown): NfeImportPhase {
    if (error instanceof HttpErrorResponse && error.status === 400) return 'invalid';
    if (error instanceof HttpErrorResponse && error.status === 409) return 'conflict';
    return 'failure';
  }

  private failureMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = (error.error as { message?: unknown } | null)?.message;
      if (error.status === 400) {
        return typeof message === 'string' && message
          ? message
          : 'Não foi possível ler o arquivo XML enviado.';
      }
      if (error.status === 409) {
        return typeof message === 'string' && message
          ? message
          : 'A nota fiscal já foi registrada.';
      }
      return 'Não foi possível enviar o arquivo. Verifique a conexão e tente novamente.';
    }
    return 'O envio demorou mais que o esperado. Verifique a conexão e tente novamente.';
  }
}
