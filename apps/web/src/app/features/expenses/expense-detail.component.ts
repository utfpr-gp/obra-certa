import { ExpenseEditModalComponent } from './components/expense-edit-modal/expense-edit-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { ActiveProjectService } from '../../core/services/active-project.service';

@Component({
  selector: 'app-expense-detail', standalone: true, imports: [RouterLink, ExpenseEditModalComponent, ConfirmModalComponent],
  template: `
    <main class="p-4 md:p-6 lg:p-8 space-y-6 text-sm text-slate-600">
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-slate-800">Despesa</h1>
          @if (activeProject(); as project) {
            <p class="mt-1 text-sm text-slate-500 break-words">{{ project.name }}</p>
          }
        </div>
        <a class="btn-oc-outline min-h-11 h-auto w-full whitespace-normal md:w-auto md:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="back-to-accounts" routerLink="/contas">Voltar para Contas a Pagar</a>
      </header>
      @if (!activeProject()) {
        <p class="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm" role="status">Selecione ou cadastre uma obra no menu para consultar uma despesa.</p>
      }
      @if (loading()) { <p role="status">Carregando despesa…</p> }
      @if (errorMessage()) { <p class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 break-words" role="alert">{{ errorMessage() }}</p> }
      @if (deletionUncertain()) {
        <button type="button" class="btn-oc-outline min-h-11 h-auto whitespace-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="check-delete-state" (click)="checkCurrentState()">Consultar estado atual</button>
      }
      @if (receiptStateUncertain() && expense()) {
        <button type="button" class="btn-oc-outline min-h-11 h-auto whitespace-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="check-receipt-state" (click)="checkCurrentState()">Consultar estado atual</button>
      }
      @if (deletionMessage()) {
        <p class="rounded-xl border p-4 break-words" [class]="deletionWarning() ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'" role="status">{{ deletionMessage() }}</p>
        <a class="btn-oc-primary min-h-11 h-auto whitespace-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="return-to-accounts" routerLink="/contas">Voltar a Contas a Pagar</a>
      }
      @if (receiptWarning()) { <p class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 break-words" role="alert">{{ receiptWarning() }}</p> }
      @if (budgetExceeded()) {
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800" role="alert" data-testid="budget-ceiling-alert">
          <span>O gasto da categoria atingiu ou ultrapassou o teto. Revise o orçamento.</span>
          <a class="inline-flex min-h-11 items-center font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc sm:ml-2" routerLink="/orcamentos">Ver orçamento</a>
        </div>
      }
      @if (budgetError()) { <p class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 break-words" role="status">{{ budgetError() }}</p> }
      @if (expense(); as expense) {
        <article class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm space-y-6">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0 space-y-3">
              <h2 class="text-xl font-semibold text-slate-800 break-words">{{ expense.description }}</h2>
              <span class="inline-flex rounded-md px-2.5 py-1 text-xs font-medium" [class]="expense.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">{{ expense.paid ? 'Quitada' : 'Pendente' }}</span>
            </div>
            <div class="flex flex-col gap-3 md:flex-row md:shrink-0">
              <button type="button" class="btn-oc-outline min-h-11 w-full md:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="edit-expense" [disabled]="removingReceipt() || uploading() || deleting() || deleteConfirmation()" (click)="openEdit()">Editar</button>
              <button type="button" class="btn-oc-danger min-h-11 w-full md:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" data-testid="delete-expense"
                [disabled]="deleting() || removingReceipt() || uploading() || downloading() || editing() !== null" (click)="openDelete()">Excluir</button>
            </div>
          </div>
          <dl class="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3 [&>div]:min-w-0 [&_dt]:text-xs [&_dt]:font-medium [&_dt]:text-slate-500 [&_dd]:mt-1 [&_dd]:break-words [&_dd]:font-medium [&_dd]:text-slate-800">
            <div><dt>Categoria</dt><dd>{{ expense.categoryName }}</dd></div>
            <div><dt>Data</dt><dd>{{ date(expense.purchaseDate) }}</dd></div>
            @if (expense.dueDate) {
              <div><dt>Vencimento</dt><dd>{{ date(expense.dueDate) }}</dd></div>
            }
            <div><dt>Fornecedor</dt><dd>{{ expense.supplier.name }}</dd></div>
            <div><dt>CNPJ</dt><dd>{{ expense.supplier.document || 'Não informado' }}</dd></div>
            @if (expense.quantity !== null) {
              <div><dt>Quantidade</dt><dd>{{ expense.quantity }}</dd></div>
              <div><dt>Valor unitário</dt><dd>{{ money(expense.unitPrice!) }}</dd></div>
            }
          </dl>
          <dl class="min-w-0 rounded-xl bg-[#E6F2F3] p-4 text-primary-oc">
            <dt class="text-sm font-medium">Total</dt>
            <dd class="mt-1 break-words text-2xl md:text-3xl font-bold tabular-nums">{{ money(expense.totalPrice) }}</dd>
          </dl>
          <section aria-labelledby="detail-receipt-title" class="min-w-0 border-t border-slate-200 pt-6 space-y-4">
            <h3 id="detail-receipt-title" class="text-base font-semibold text-slate-700">Comprovante</h3>
          @if (expense.receiptState === 'UPLOADED') {
            <div class="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <button class="btn-oc-outline min-h-11 h-auto whitespace-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="download-receipt" type="button"
              [disabled]="downloading() || removingReceipt() || uploading() || deleting() || deleteConfirmation()" (click)="downloadReceipt()">Consultar comprovante</button>
            <button class="btn-oc-ghost min-h-11 h-auto whitespace-normal text-rose-700 hover:text-rose-800 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" data-testid="remove-receipt" type="button"
              [disabled]="removingReceipt() || downloading() || uploading() || editing() !== null || deleting() || deleteConfirmation()" (click)="removeReceipt()">{{ removingReceipt() ? 'Removendo comprovante…' : 'Remover comprovante' }}</button>
            </div>
          } @else {
            <span class="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600" data-testid="no-receipt">Sem comprovante</span>
          }
            <label class="block min-w-0 text-sm font-medium text-slate-700">
              <span>{{ expense.receiptState === 'UPLOADED' ? 'Substituir comprovante' : 'Comprovante' }} (JPEG, PNG e PDF, até 10 MB — 10 MiB)</span>
              <input class="file-input mt-2 h-11 min-h-11 min-w-0 w-full overflow-hidden rounded-md border border-slate-300 bg-white p-0 text-sm leading-[42px] text-slate-600 file:mr-3 file:h-full file:rounded-none file:border-0 file:border-r file:border-solid file:border-slate-200 file:bg-slate-100 file:px-4 file:py-0 file:align-top file:text-sm file:leading-normal file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-oc disabled:cursor-not-allowed disabled:opacity-60" data-testid="receipt-file" type="file"
                accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" [disabled]="uploading() || removingReceipt() || downloading() || editing() !== null || deleting() || deleteConfirmation()"
                (change)="selectReceipt($event)" />
            </label>
            @if (receiptError()) { <p class="text-xs text-rose-700 break-words" role="alert" data-testid="receipt-error">{{ receiptError() }}</p> }
            @if (uploadProgress() !== null) {
              <progress class="progress w-full text-primary-oc" max="100" [value]="uploadProgress()" aria-label="Progresso do comprovante"></progress>
            }
            <button class="btn-oc-primary min-h-11 h-auto w-full whitespace-normal md:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" data-testid="upload-receipt" type="button"
              [disabled]="uploading() || removingReceipt() || downloading() || editing() !== null || !receiptFile() || deleting() || deleteConfirmation()" (click)="uploadReceipt()">{{ expense.receiptState === 'UPLOADED' ? 'Substituir comprovante' : 'Enviar comprovante' }}</button>
          </section>
        </article>
        <p class="text-sm text-slate-500">Despesa salva. Você pode voltar a esta consulta pelo endereço desta página.</p>
      }
      @if (editing(); as edited) {
        <app-expense-edit-modal [expense]="edited" (saved)="expenseSaved($event)"
          (cancel)="editing.set(null)" (checkState)="checkCurrentState()" />
      }
      <app-confirm-modal [isOpen]="deleteConfirmation()" title="Excluir despesa" confirmText="Excluir"
        [description]="'Deseja excluir a despesa ' + (expense()?.description || '') + '?'"
        [saving]="deleting()" (confirm)="confirmDelete()" (cancel)="deleteConfirmation.set(false)" />
      <nav aria-label="Ações da despesa" class="flex flex-col gap-3 sm:flex-row">
        <a class="btn-oc-primary min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" routerLink="/contas/nova">Nova despesa</a>
        <a class="btn-oc-ghost min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-oc" routerLink="/orcamentos">Ver orçamento</a>
      </nav>
    </main>
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
  readonly deleteConfirmation = signal(false);
  readonly deleting = signal(false);
  readonly deletionMessage = signal('');
  readonly deletionWarning = signal(false);
  readonly deletionUncertain = signal(false);
  readonly receiptStateUncertain = signal(false);
  private expenseRequestVersion = 0;
  private budgetRequestVersion = 0;
  readonly budgetExceeded = signal(false);
  readonly budgetError = signal('');
  readonly expense = signal<ExpenseResponse | null>(null);
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly removingReceipt = signal(false);
  readonly errorMessage = signal('');
  readonly receiptWarning = signal('');
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
        this.deleteConfirmation.set(false); this.deleting.set(false);
        this.deletionMessage.set(''); this.deletionWarning.set(false); this.deletionUncertain.set(false);
        this.expense.set(null); this.loading.set(false); this.budgetExceeded.set(false); this.budgetError.set('');
        this.receiptFile.set(null); this.receiptError.set(''); this.uploading.set(false);
        this.receiptWarning.set('');
        this.receiptStateUncertain.set(false);
        this.downloading.set(false); this.removingReceipt.set(false); this.uploadProgress.set(null);
        this.errorMessage.set(this.activeProject() ? 'A obra foi alterada. Abra uma despesa da obra selecionada.' : '');
      });
    });
    if (!this.activeProject()) { this.loading.set(false); return; }
    this.loadExpense(id);
  }
  private loadExpense(id: string): void {
    const requestVersion = ++this.expenseRequestVersion;
    this.expenses.get(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: expense => {
        if (!this.isCurrentContext() || requestVersion !== this.expenseRequestVersion) return;
        if (expense.projectId !== this.activeProject()?.id) {
          this.loading.set(false); this.errorMessage.set('A despesa pertence a outra obra. Selecione a obra correspondente.'); return;
        }
        this.expense.set(expense); this.loading.set(false);
        this.loadBudget(expense);
      },
      error: (error: HttpErrorResponse) => {
        if (!this.isCurrentContext() || requestVersion !== this.expenseRequestVersion) return;
        if (error.status === 404) {
          this.expense.set(null); this.editing.set(null); this.deleteConfirmation.set(false);
          this.receiptFile.set(null); this.receiptError.set(''); this.receiptWarning.set('');
          this.budgetExceeded.set(false); this.budgetError.set(''); ++this.budgetRequestVersion;
        }
        this.errorMessage.set('Despesa não encontrada ou indisponível.'); this.loading.set(false);
      },
    });
  }
  openEdit(): void {
    if (this.isCurrentContext() && this.activeProject() && this.expense() && !this.removingReceipt() && !this.uploading()
      && !this.deleting() && !this.deleteConfirmation()) this.editing.set(this.expense());
  }
  openDelete(): void {
    if (!this.isCurrentContext() || !this.expense() || !this.activeProject() || this.deleting()
      || this.editing() || this.removingReceipt() || this.uploading() || this.downloading()) return;
    this.deleteConfirmation.set(true);
  }
  confirmDelete(): void {
    const expense = this.expense();
    if (!this.isCurrentContext() || !expense || !this.deleteConfirmation() || this.deleting()
      || this.editing() || this.removingReceipt() || this.uploading() || this.downloading()) return;
    this.deleting.set(true); this.errorMessage.set(''); this.deletionUncertain.set(false);
    this.expenses.delete(expense.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (!this.isCurrentContext()) return;
        this.deleting.set(false); this.deleteConfirmation.set(false);
        if (!result.deleted || result.id !== expense.id) { this.deleteNotConfirmed(); return; }
        this.expense.set(null); this.editing.set(null); this.receiptFile.set(null); this.receiptError.set('');
        ++this.expenseRequestVersion;
        this.loading.set(false); this.receiptStateUncertain.set(false);
        this.receiptWarning.set(''); this.budgetExceeded.set(false); this.budgetError.set('');
        ++this.budgetRequestVersion;
        this.deletionWarning.set(result.receiptDeletionFailed);
        this.deletionMessage.set(result.receiptDeletionFailed
          ? 'Despesa excluída, mas não foi possível apagar o comprovante.' : 'Despesa excluída.');
      },
      error: () => {
        if (!this.isCurrentContext()) return;
        this.deleting.set(false); this.deleteNotConfirmed();
      },
    });
  }
  private deleteNotConfirmed(): void {
    this.deletionUncertain.set(true);
    this.errorMessage.set('A exclusão da despesa não foi confirmada. Consulte o estado atual antes de tentar novamente.');
  }
  expenseSaved(expense: ExpenseResponse): void {
    if (!this.isCurrentContext() || expense.projectId !== this.activeProject()?.id) return;
    this.editing.set(null); this.expense.set(expense); this.errorMessage.set(''); this.loadBudget(expense);
  }
  checkCurrentState(): void {
    const expense = this.expense();
    if (!this.isCurrentContext() || !expense || this.deleting()) return;
    this.editing.set(null); this.deleteConfirmation.set(false); this.deletionUncertain.set(false);
    this.receiptStateUncertain.set(false);
    this.errorMessage.set(''); this.loading.set(true); this.loadExpense(expense.id);
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
    if (!this.isCurrentContext() || this.uploading() || this.removingReceipt() || this.downloading() || this.editing() || this.deleting() || this.deleteConfirmation()) return;
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
    if (!this.isCurrentContext() || !expense || !file || this.uploading() || this.removingReceipt() || this.downloading() || this.editing() || this.deleting() || this.deleteConfirmation()) return;
    this.uploading.set(true); this.uploadProgress.set(0); this.errorMessage.set(''); this.receiptError.set('');
    this.receiptStateUncertain.set(false);
    this.receiptWarning.set('');
    this.expenses.uploadReceipt(expense.id,file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: event => {
        if (!this.isCurrentContext()) return;
        if (event.type === HttpEventType.UploadProgress && event.total)
          this.uploadProgress.set(Math.round(100*event.loaded/event.total));
        if (event.type === HttpEventType.Response) {
          this.expense.set(event.body); this.receiptFile.set(null);
          this.receiptWarning.set(event.body?.receiptDeletionFailed ? 'Novo comprovante salvo, mas não foi possível apagar o anterior.' : '');
          this.uploading.set(false); this.uploadProgress.set(null);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (!this.isCurrentContext()) return;
        this.uploading.set(false); this.uploadProgress.set(null);
        this.receiptStateUncertain.set(true);
        if (error.status === 400 || error.status === 413) this.receiptError.set(ExpenseService.receiptGuidance);
        const message = typeof error.error?.message === 'string' ? error.error.message as string : '';
        const uncertain = error.status === 0 || (error.status >= 500 && error.status !== 503);
        this.errorMessage.set(expense.receiptState === 'UPLOADED'
          ? uncertain ? 'A substituição não foi confirmada. Consulte o estado atual antes de tentar novamente.'
            : `A substituição não foi confirmada; o comprovante anterior foi preservado. ${message || 'Consulte o estado atual antes de tentar novamente.'}`
          : 'Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.');
      },
    });
  }
  downloadReceipt(): void {
    const expense = this.expense();
    if (!this.isCurrentContext() || !expense || this.downloading() || this.removingReceipt() || this.uploading() || this.deleting() || this.deleteConfirmation()) return;
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
  }
  removeReceipt(): void {
    const expense = this.expense();
    if (!this.isCurrentContext() || !expense || expense.receiptState !== 'UPLOADED'
      || this.removingReceipt() || this.downloading() || this.uploading() || this.editing() || this.deleting() || this.deleteConfirmation()) return;
    this.removingReceipt.set(true); this.errorMessage.set('');
    this.receiptStateUncertain.set(false);
    this.expenses.removeReceipt(expense.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => {
        if (!this.isCurrentContext()) return;
        this.expense.set(updated); this.removingReceipt.set(false);
      },
      error: () => {
        if (!this.isCurrentContext()) return;
        this.removingReceipt.set(false);
        this.receiptStateUncertain.set(true);
        this.errorMessage.set('A remoção do comprovante não foi confirmada. Consulte o estado atual antes de tentar novamente.');
      },
    });
  }
  money(value: number): string { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value); }
  date(value: string): string { return value.substring(0, 10).split('-').reverse().join('/'); }
}
