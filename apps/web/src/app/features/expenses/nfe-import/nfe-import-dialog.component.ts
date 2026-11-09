import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  computed,
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
import { ExpenseCategory } from '../../../core/models/expense-category.model';
import { ExpenseResponse } from '../../../core/models/expense-registration.model';
import { NfePreview } from '../../../core/models/nfe-import.model';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { CategoryService } from '../../../core/services/category.service';
import { NfeImportService } from '../../../core/services/nfe-import.service';
import { formatCivilDate } from '../../../shared/utils/civil-date';

type NfeImportPhase = 'idle' | 'sending' | 'preview' | 'invalid' | 'conflict' | 'failure' | 'confirming' | 'result';

@Component({
  selector: 'app-nfe-import-dialog',
  standalone: true,
  imports: [LucideX],
  templateUrl: './nfe-import-dialog.component.html',
  styleUrl: './nfe-import-dialog.component.css',
})
export class NfeImportDialogComponent implements AfterViewInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly closed = output<void>();
  readonly imported = output<ExpenseResponse[]>();

  private readonly nfeImport = inject(NfeImportService);
  private readonly categories = inject(CategoryService);
  private readonly activeProject = inject(ActiveProjectService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  // Captured once: A → B → A must still discard a response from before the transition.
  private readonly context = this.activeProject.contextVersion();
  private destroyed = false;
  private closedOnce = false;
  // Incremented on every preview request; a response from an older request is discarded.
  private previewRequestId = 0;

  readonly phase = signal<NfeImportPhase>('idle');
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly preview = signal<NfePreview | null>(null);
  readonly categoryOptions = signal<ExpenseCategory[]>([]);
  readonly categoriesLoading = signal(false);
  readonly categoriesError = signal<string | null>(null);
  readonly selectedCategories = signal<Record<number, string | undefined>>({});
  readonly paid = signal(true);
  readonly confirmError = signal<string | null>(null);
  readonly confirmUncertain = signal(false);
  readonly importedRows = signal<ExpenseResponse[]>([]);
  readonly busy = computed(() => this.phase() === 'sending' || this.phase() === 'confirming');
  readonly missingItems = computed(() => {
    const note = this.preview();
    if (!note) return [];
    const choices = this.selectedCategories();
    return note.items.filter((item) => !choices[item.itemNumber]).map((item) => item.itemNumber);
  });

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
    if (this.opener?.isConnected) this.opener.focus();
  }

  onFileSelected(event: Event): void {
    if (this.busy()) return;
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.fileError.set(null);
    this.resetPreview();
    this.phase.set('idle');
  }

  send(): void {
    if (!this.current() || this.busy()) return;
    const file = this.selectedFile();
    if (!file || file.size === 0) {
      this.fileError.set('Selecione um arquivo XML de NF-e para enviar.');
      return;
    }
    this.fileError.set(null);
    this.errorMessage.set('');
    this.resetPreview();
    this.phase.set('sending');
    const projectId = this.projectId();
    const requestId = ++this.previewRequestId;
    this.nfeImport.preview(projectId, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (requestId !== this.previewRequestId) return;
        if (!this.current() || response.projectId !== projectId) return;
        this.preview.set(response);
        this.phase.set('preview');
        this.loadCategories();
      },
      error: (error: unknown) => {
        if (requestId !== this.previewRequestId) return;
        if (!this.current()) return;
        this.phase.set(this.failurePhase(error));
        this.errorMessage.set(this.failureMessage(error));
      },
    });
  }

  retry(): void {
    this.send();
  }

  loadCategories(): void {
    if (this.categoriesLoading()) return;
    this.categoriesLoading.set(true);
    this.categoriesError.set(null);
    this.categories.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (categories) => {
        if (!this.current()) return;
        this.categoryOptions.set(categories);
        this.categoriesLoading.set(false);
      },
      error: () => {
        if (!this.current()) return;
        this.categoryOptions.set([]);
        this.categoriesLoading.set(false);
        this.categoriesError.set('Não foi possível carregar as categorias. Tente novamente.');
      },
    });
  }

  selectCategory(itemNumber: number, event: Event): void {
    const categoryId = (event.target as HTMLSelectElement).value;
    this.selectedCategories.update((choices) => ({ ...choices, [itemNumber]: categoryId }));
    this.confirmError.set(null);
    this.confirmUncertain.set(false);
  }

  onPaidChange(event: Event): void {
    this.paid.set((event.target as HTMLInputElement).checked);
  }

  confirm(): void {
    if (!this.current() || this.phase() !== 'preview' || this.busy()) return;
    const note = this.preview();
    const file = this.selectedFile();
    if (!note || !file || this.categoriesLoading() || this.categoriesError() || this.missingItems().length) return;
    const choices = this.selectedCategories();
    const items = note.items.map((item) => ({ itemNumber: item.itemNumber, categoryId: choices[item.itemNumber]! }));
    this.confirmError.set(null);
    this.confirmUncertain.set(false);
    this.phase.set('confirming');
    this.nfeImport.confirm(this.projectId(), file, items, this.paid()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (created) => {
        if (!this.current()) return;
        this.importedRows.set(created);
        this.phase.set('result');
      },
      error: (error: unknown) => {
        if (!this.current()) return;
        this.phase.set('preview');
        if (error instanceof HttpErrorResponse && error.status === 401) return;
        this.confirmError.set(this.confirmFailureMessage(error));
        this.confirmUncertain.set(!(error instanceof HttpErrorResponse) || error.status >= 500 || error.status === 0);
      },
    });
  }

  retryConfirm(): void {
    this.confirm();
  }

  conclude(): void {
    if (this.phase() !== 'result' || this.destroyed || this.closedOnce) return;
    const created = this.importedRows();
    this.imported.emit(created);
    this.finish();
  }

  goManual(): void {
    void this.router.navigate(['/contas/nova']);
    this.finish();
  }

  close(): void {
    if (this.busy() || this.phase() === 'result') return;
    this.finish();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.destroyed || this.closedOnce) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) return;
    const nodes = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]'),
    );
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
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

  private resetPreview(): void {
    this.preview.set(null);
    this.errorMessage.set('');
    this.categoryOptions.set([]);
    this.categoriesLoading.set(false);
    this.categoriesError.set(null);
    this.selectedCategories.set({});
    this.paid.set(true);
    this.confirmError.set(null);
    this.confirmUncertain.set(false);
    this.importedRows.set([]);
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

  private confirmFailureMessage(error: unknown): string {
    const message = error instanceof HttpErrorResponse
      ? (error.error as { message?: unknown } | null)?.message
      : null;
    if (typeof message === 'string' && message && error instanceof HttpErrorResponse
      && (error.status === 400 || error.status === 409)) {
      return message;
    }
    return 'Não é possível saber se a importação foi gravada. Verifique a lista de despesas antes de tentar novamente.';
  }
}
