import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NfePreview } from '../models/nfe-import.model';

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
}
