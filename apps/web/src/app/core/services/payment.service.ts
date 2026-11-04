import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentAlerts, PaymentSettlementRequest } from '../models/payment.model';
import { ExpenseResponse } from '../models/expense-registration.model';
import { ExpenseService } from './expense.service';
import { ActiveProjectService } from './active-project.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly expenses = inject(ExpenseService);
  private readonly activeProject = inject(ActiveProjectService);
  // Only uncertainty survives closing a dialog; no form values or retry intent are stored.
  private readonly uncertain = new Set<string>();

  requiresReconciliation(projectId: string, expenseId: string): boolean {
    return this.uncertain.has(this.key(projectId, expenseId));
  }

  settle(projectId: string, expenseId: string, paymentDate: string): Observable<ExpenseResponse> {
    const key = this.key(projectId, expenseId);
    if (this.uncertain.has(key)) return throwError(() => new Error('Consulte o estado antes de tentar novamente.'));
    const request: PaymentSettlementRequest = { paymentDate };
    return this.http.put<ExpenseResponse>(
      `${environment.apiUrl}/api/projects/${encodeURIComponent(projectId)}/expenses/${encodeURIComponent(expenseId)}/payment`, request,
    ).pipe(
      timeout(30000),
      map(result => this.matchExpense(result, projectId, expenseId)),
      map(result => { if (!result.paid) throw new Error('Quitação não confirmada.'); return result; }),
      tap(() => this.uncertain.delete(key)),
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse && error.status === 401) && this.activeProject.activeProject()) {
          this.uncertain.add(key);
        }
        return throwError(() => error);
      }),
    );
  }

  reconcile(projectId: string, expenseId: string): Observable<ExpenseResponse> {
    return this.expenses.get(expenseId).pipe(
      timeout(30000),
      map(result => this.matchExpense(result, projectId, expenseId)),
      tap(() => this.uncertain.delete(this.key(projectId, expenseId))),
    );
  }

  private key(projectId: string, expenseId: string): string {
    return `${projectId}/${expenseId}`;
  }

  private matchExpense(result: ExpenseResponse, projectId: string, expenseId: string): ExpenseResponse {
    if (result.projectId !== projectId || result.id !== expenseId) throw new Error('Despesa indisponível nesta obra.');
    return result;
  }

  getAlerts(projectId: string): Observable<PaymentAlerts> {
    return this.http.get<PaymentAlerts>(
      `${environment.apiUrl}/api/projects/${encodeURIComponent(projectId)}/payment-alerts`,
    ).pipe(timeout(30000));
  }
}
