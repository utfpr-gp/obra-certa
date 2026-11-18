import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetCategory,
  BudgetOverview,
  BudgetSetDTO,
  SinapiAvailability,
  SinapiConfirmation,
  SinapiConfirmDTO,
  SinapiReferences,
} from '../models/budget.model';

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

  getSinapiReferences(
    projectId: string,
    uf: string,
    month: string,
    projectType: string,
  ): Observable<SinapiReferences> {
    const params = new HttpParams().set('uf', uf).set('month', month).set('projectType', projectType);
    return this.http
      .get<SinapiReferences>(`${this.endpoint}/${projectId}/sinapi/references`, { params })
      .pipe(timeout(15000));
  }

  getSinapiAvailability(projectId: string, uf: string, year: string): Observable<SinapiAvailability> {
    const params = new HttpParams().set('uf', uf).set('year', year);
    return this.http
      .get<SinapiAvailability>(`${this.endpoint}/${projectId}/sinapi/availability`, { params })
      .pipe(timeout(15000));
  }

  confirmSinapi(projectId: string, dto: SinapiConfirmDTO): Observable<SinapiConfirmation> {
    return this.http.post<SinapiConfirmation>(`${this.endpoint}/${projectId}/sinapi/confirm`, dto);
  }

  setBudget(
    projectId: string,
    categoryId: string,
    dto: BudgetSetDTO,
  ): Observable<BudgetCategory> {
    return this.http.put<BudgetCategory>(
      `${this.endpoint}/${projectId}/categories/${categoryId}`,
      dto,
    );
  }

  zeroBudget(projectId: string, categoryId: string): Observable<BudgetCategory> {
    return this.http.post<BudgetCategory>(
      `${this.endpoint}/${projectId}/categories/${categoryId}/zero`,
      null,
    );
  }
}
