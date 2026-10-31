import { ExpenseEditModalComponent } from './components/expense-edit-modal/expense-edit-modal.component';
import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { ActiveProjectService } from '../../core/services/active-project.service';

@Component({
  selector: 'app-expense-detail', standalone: true, imports: [RouterLink, ExpenseEditModalComponent],
  template: `
    <section class="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 class="text-2xl font-bold mb-6">Despesa</h1>
      @if (!activeProject()) {
        <p role="status">Selecione ou cadastre uma obra no menu para consultar uma despesa.</p>
      }
      @if (loading()) { <p role="status">Carregando despesa…</p> }
      @if (errorMessage()) { <p class="alert alert-error" role="alert">{{ errorMessage() }}</p> }
      @if (budgetExceeded()) {
        <div class="alert alert-warning my-4" role="alert" data-testid="budget-ceiling-alert">
          <span>O gasto da categoria atingiu ou ultrapassou o teto. Revise o orçamento.</span>
          <a class="link" routerLink="/orcamentos">Ver orçamento</a>
        </div>
      }
      @if (budgetError()) { <p class="alert alert-warning my-4" role="status">{{ budgetError() }}</p> }
      @if (expense(); as expense) {
        <article class="card bg-base-100 border border-base-300 p-6">
          <h2 class="text-xl font-semibold">{{ expense.description }}</h2>
          <button type="button" class="btn btn-outline my-3" data-testid="edit-expense" (click)="openEdit()">Editar</button>
          <span class="badge badge-success my-3">{{ expense.paid ? 'Quitada' : 'Pendente' }}</span>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><dt class="font-semibold">Categoria</dt><dd>{{ expense.categoryName }}</dd></div>
            <div><dt class="font-semibold">Data</dt><dd>{{ date(expense.purchaseDate) }}</dd></div>
            @if (expense.dueDate) {
              <div><dt class="font-semibold">Vencimento</dt><dd>{{ date(expense.dueDate) }}</dd></div>
            }
            <div><dt class="font-semibold">Fornecedor</dt><dd>{{ expense.supplier.name }}</dd></div>
            <div><dt class="font-semibold">CNPJ</dt><dd>{{ expense.supplier.document || 'Não informado' }}</dd></div>
            @if (expense.quantity !== null) {
              <div><dt class="font-semibold">Quantidade</dt><dd>{{ expense.quantity }}</dd></div>
              <div><dt class="font-semibold">Valor unitário</dt><dd>{{ money(expense.unitPrice!) }}</dd></div>
            }
            <div><dt class="font-semibold">Total</dt><dd class="text-xl">{{ money(expense.totalPrice) }}</dd></div>
          </dl>
          @if (expense.receiptState === 'UPLOADED') {
            <button class="btn btn-outline mt-4" data-testid="download-receipt" type="button"
              [disabled]="downloading()" (click)="downloadReceipt()">Consultar comprovante</button>
          } @else {
            <span class="badge badge-warning my-3" data-testid="no-receipt">Sem comprovante</span>
            <label class="form-control mt-4">
              <span>Comprovante (JPEG, PNG e PDF, até 10 MB — 10 MiB)</span>
              <input class="file-input file-input-bordered" data-testid="receipt-file" type="file"
                accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" [disabled]="uploading()"
                (change)="selectReceipt($event)" />
            </label>
            @if (receiptError()) { <p class="text-error" role="alert" data-testid="receipt-error">{{ receiptError() }}</p> }
            @if (uploadProgress() !== null) {
              <progress class="progress progress-primary mt-3" max="100" [value]="uploadProgress()" aria-label="Progresso do comprovante"></progress>
            }
            <button class="btn btn-outline mt-4" data-testid="upload-receipt" type="button"
              [disabled]="uploading() || !receiptFile()" (click)="uploadReceipt()">Enviar comprovante</button>
          }
        </article>
        <p class="my-4">Despesa salva. Você pode voltar a esta consulta pelo endereço desta página.</p>
      }
      @if (editing(); as edited) {
        <app-expense-edit-modal [expense]="edited" (saved)="expenseSaved($event)"
          (cancel)="editing.set(null)" (checkState)="checkCurrentState()" />
      }
      <a class="btn btn-primary mt-4" routerLink="/contas/nova">Nova despesa</a>
      <a class="btn btn-ghost mt-4" routerLink="/orcamentos">Ver orçamento</a>
    </section>
  `,
})
export class ExpenseDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly expenses = inject(ExpenseService);
  private readonly budgets = inject(BudgetService);
  private readonly projects = inject(ActiveProjectService);
  readonly activeProject = this.projects.activeProject;
  private contextVersion: number | null = this.activeProject() ? this.projects.contextVersion() : null;
  readonly editing = signal<ExpenseResponse | null>(null);
  private budgetRequestVersion = 0;
  readonly budgetExceeded = signal(false);
  readonly budgetError = signal('');
  readonly expense = signal<ExpenseResponse | null>(null);
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly errorMessage = signal('');
  readonly receiptFile = signal<File | null>(null);
  readonly receiptError = signal('');
  readonly uploading = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
    effect(() => {
      const version = this.projects.contextVersion();
      const project = this.activeProject();
      if (this.contextVersion === null) {
        if (project) untracked(() => {
          this.contextVersion = version;
          this.loading.set(true);
          this.loadExpense(id);
        });
        return;
      }
      if (version !== this.contextVersion) untracked(() => {
        this.editing.set(null);
        this.expense.set(null); this.loading.set(false); this.budgetExceeded.set(false); this.budgetError.set('');
        this.receiptFile.set(null); this.receiptError.set(''); this.uploading.set(false);
        this.downloading.set(false); this.uploadProgress.set(null);
        this.errorMessage.set(this.activeProject() ? 'A obra foi alterada. Abra uma despesa da obra selecionada.' : '');
      });
    });
    if (!this.activeProject()) { this.loading.set(false); return; }
    this.loadExpense(id);
  }
  private loadExpense(id: string): void {
    this.expenses.get(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: expense => {
        if (!this.isCurrentContext()) return;
        if (expense.projectId !== this.activeProject()?.id) {
          this.loading.set(false); this.errorMessage.set('A despesa pertence a outra obra. Selecione a obra correspondente.'); return;
        }
        this.expense.set(expense); this.loading.set(false);
        this.loadBudget(expense);
      },
      error: () => {
        if (!this.isCurrentContext()) return;
        this.errorMessage.set('Despesa não encontrada ou indisponível.'); this.loading.set(false);
      },
    });
  }
  openEdit(): void {
    if (this.isCurrentContext() && this.activeProject() && this.expense()) this.editing.set(this.expense());
  }
  expenseSaved(expense: ExpenseResponse): void {
    if (!this.isCurrentContext() || expense.projectId !== this.activeProject()?.id) return;
    this.editing.set(null); this.expense.set(expense); this.errorMessage.set(''); this.loadBudget(expense);
  }
  checkCurrentState(): void {
    const expense = this.expense();
    if (!this.isCurrentContext() || !expense) return;
    this.editing.set(null); this.loading.set(true); this.loadExpense(expense.id);
  }
  private loadBudget(expense: ExpenseResponse): void {
    const requestVersion = ++this.budgetRequestVersion;
    this.budgetExceeded.set(false); this.budgetError.set('');
    this.budgets.getOverview(expense.projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: overview => {
        if (this.isCurrentContext() && requestVersion === this.budgetRequestVersion) this.budgetExceeded.set(overview.categories.some(
          category => category.categoryId === expense.categoryId && category.plannedAmount > 0 && category.state === 'EXCEEDED'));
      },
      error: () => {
        if (this.isCurrentContext() && requestVersion === this.budgetRequestVersion) this.budgetError.set('Não foi possível consultar o orçamento. A despesa está salva; confira o orçamento novamente.');
      },
    });
  }
  private isCurrentContext(): boolean {
    return this.projects.contextVersion() === this.contextVersion;
  }
  selectReceipt(event: Event): void {
    if (!this.isCurrentContext() || this.uploading()) return;
    const input=event.target as HTMLInputElement;
    const file=input.files?.item(0);
    this.receiptFile.set(null); this.receiptError.set('');
    if (!file) return;
    if (!ExpenseService.validReceipt(file)) {
      input.value=''; this.receiptError.set(ExpenseService.receiptGuidance); return;
    }
    this.receiptFile.set(file);
  }
  uploadReceipt(): void {
    const expense=this.expense(), file=this.receiptFile();
    if (!this.isCurrentContext() || !expense || expense.receiptState === 'UPLOADED' || !file || this.uploading()) return;
    this.uploading.set(true); this.uploadProgress.set(0); this.errorMessage.set(''); this.receiptError.set('');
    this.expenses.uploadReceipt(expense.id,file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: event => {
        if (!this.isCurrentContext()) return;
        if (event.type === HttpEventType.UploadProgress && event.total)
          this.uploadProgress.set(Math.round(100*event.loaded/event.total));
        if (event.type === HttpEventType.Response) {
          this.expense.set(event.body); this.receiptFile.set(null);
          this.uploading.set(false); this.uploadProgress.set(null);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (!this.isCurrentContext()) return;
        this.uploading.set(false); this.uploadProgress.set(null);
        if (error.status === 400 || error.status === 413) this.receiptError.set(ExpenseService.receiptGuidance);
        this.errorMessage.set('Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.');
      },
    });
  }
  downloadReceipt(): void {
    const expense = this.expense();
    if (!this.isCurrentContext() || !expense || this.downloading()) return;
    this.downloading.set(true); this.errorMessage.set('');
    this.expenses.downloadReceipt(expense.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: blob => {
        if (!this.isCurrentContext()) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href=url; link.download=`comprovante.${blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg'}`;
        link.click(); URL.revokeObjectURL(url); this.downloading.set(false);
      },
      error: () => {
        if (!this.isCurrentContext()) return;
        this.downloading.set(false); this.errorMessage.set('Não foi possível consultar o comprovante. Tente novamente.');
      },
    });
  }  money(value: number): string { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value); }
  date(value: string): string { return value.substring(0, 10).split('-').reverse().join('/'); }
}
