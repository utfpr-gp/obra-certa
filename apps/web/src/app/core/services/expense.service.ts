import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpenseCreate, ExpenseResponse } from '../models/expense-registration.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/expenses`;

  create(request: ExpenseCreate): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(this.endpoint, request);
  }

  get(id: string): Observable<ExpenseResponse> {
    return this.http.get<ExpenseResponse>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }
}
