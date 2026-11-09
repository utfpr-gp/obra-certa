import { AfterViewInit, Component, computed, ElementRef, HostListener, inject, input, OnDestroy, OnInit, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PaymentTarget } from '../../../core/models/payment.model';
import { ExpenseResponse } from '../../../core/models/expense-registration.model';
import { PaymentService } from '../../../core/services/payment.service';
import { ActiveProjectService } from '../../../core/services/active-project.service';

@Component({
  selector: 'app-payment-modal', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './payment-modal.component.html',
})
export class PaymentModalComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly target = input.required<PaymentTarget>();
  readonly projectId = input.required<string>();
  readonly closed = output<void>();
  readonly settled = output<ExpenseResponse>();
  private readonly payments = inject(PaymentService);
  private readonly active = inject(ActiveProjectService);
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly dateInput = viewChild.required<ElementRef<HTMLInputElement>>('dateInput');
  private readonly opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private context = -1;
  private destroyed = false;
  private request?: Subscription;
  readonly phase = signal<'ready' | 'sending' | 'uncertain' | 'reconciling'>('ready');
  readonly busy = computed(() => this.phase() === 'sending' || this.phase() === 'reconciling');
  readonly message = signal('');
  readonly form = new FormGroup({ paymentDate: new FormControl('', { nonNullable: true,
    validators: [Validators.required, control => {
      const value: string = control.value;
      if (!value) return null;
      const parsed = new Date(`${value}T00:00:00Z`);
      return !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime())
        || parsed.toISOString().slice(0, 10) !== value || value < this.target().purchaseDate
        ? { paymentDate: true } : null;
    }],
  }) });

  ngOnInit(): void {
    this.context = this.active.contextVersion();
    const target = this.target();
    this.form.controls.paymentDate.setValue(target.referenceDate > target.purchaseDate ? target.referenceDate : target.purchaseDate);
    if (this.payments.requiresReconciliation(this.projectId(), target.expenseId)) {
      this.phase.set('uncertain'); this.message.set('Não foi possível confirmar o resultado anterior. Consulte o estado atual antes de tentar novamente.');
    }
  }

  ngAfterViewInit(): void { this.dateInput().nativeElement.focus(); }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.request?.unsubscribe();
    if (this.opener?.isConnected) this.opener.focus();
  }

  confirm(): void {
    if (!this.current() || this.phase() !== 'ready') return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.phase.set('sending'); this.message.set('');
    this.request = this.payments.settle(this.projectId(), this.target().expenseId, this.form.controls.paymentDate.value).subscribe({
      next: expense => { if (this.current()) this.settled.emit(expense); },
      error: () => {
        if (!this.current()) return;
        this.phase.set('uncertain');
        this.message.set('Não foi possível confirmar a quitação. Consulte o estado atual antes de tentar novamente.');
      },
    });
  }

  reconcile(): void {
    if (!this.current() || this.phase() !== 'uncertain') return;
    this.phase.set('reconciling');
    this.request = this.payments.reconcile(this.projectId(), this.target().expenseId).subscribe({
      next: expense => {
        if (!this.current()) return;
        if (expense.paid) this.settled.emit(expense);
        else {
          this.phase.set('ready');
          this.message.set('A consulta confirmou que a conta está pendente. Você pode confirmar novamente.');
        }
      },
      error: () => {
        if (!this.current()) return;
        this.phase.set('uncertain');
        this.message.set('Não foi possível confirmar o estado da conta. Consulte novamente antes de tentar quitar.');
      },
    });
  }

  close(): void { if (this.current() && !this.busy()) this.closed.emit(); }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.current()) return;
    if (event.key === 'Escape') { event.preventDefault(); this.close(); }
    if (event.key !== 'Tab') return;
    const nodes = Array.from(this.dialog().nativeElement.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (!first) { event.preventDefault(); this.dialog().nativeElement.focus(); return; }
    // The container itself (tabindex=-1) counts as "before the first": Shift+Tab goes to the last control.
    if (event.shiftKey && (document.activeElement === first || document.activeElement === this.dialog().nativeElement || !this.dialog().nativeElement.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !this.dialog().nativeElement.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }

  money(value: number): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }

  private current(): boolean {
    return !this.destroyed && this.context === this.active.contextVersion() && this.projectId() === this.active.activeProject()?.id;
  }
}
