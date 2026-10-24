import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BudgetOverview } from '../models/budget.model';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/budgets`;

  getOverview(projectId: string): Observable<BudgetOverview> {
    const params = new HttpParams().set('projectId', projectId);
    return this.http.get<BudgetOverview>(this.endpoint, { params });
  }
}
