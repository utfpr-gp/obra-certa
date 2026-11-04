import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentAlerts } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  getAlerts(projectId: string): Observable<PaymentAlerts> {
    return this.http.get<PaymentAlerts>(
      `${environment.apiUrl}/api/projects/${encodeURIComponent(projectId)}/payment-alerts`,
    ).pipe(timeout(30000));
  }
}
