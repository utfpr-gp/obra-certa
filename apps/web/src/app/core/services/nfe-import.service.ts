import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpenseResponse } from '../models/expense-registration.model';
import { NfeImportItemChoice, NfePreview } from '../models/nfe-import.model';

@Injectable({ providedIn: 'root' })
export class NfeImportService {
  private readonly http = inject(HttpClient);

  preview(projectId: string, file: File): Observable<NfePreview> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<NfePreview>(
      `${environment.apiUrl}/api/projects/${encodeURIComponent(projectId)}/nfe/preview`,
      form,
    ).pipe(timeout(30000));
  }

  confirm(
    projectId: string,
    file: File,
    items: NfeImportItemChoice[],
    paid: boolean,
  ): Observable<ExpenseResponse[]> {
    const form = new FormData();
    form.append('file', file);
    form.append('items', new Blob([JSON.stringify({ items })], { type: 'application/json' }));
    form.append('payment', new Blob([JSON.stringify({ paid })], { type: 'application/json' }));
    return this.http.post<ExpenseResponse[]>(
      `${environment.apiUrl}/api/projects/${encodeURIComponent(projectId)}/nfe/imports`,
      form,
    ).pipe(timeout(30000));
  }
}
