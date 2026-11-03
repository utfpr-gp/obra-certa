import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/projects`;

  get(projectId: string): Observable<Report> {
    return this.http.get<Report>(`${this.endpoint}/${encodeURIComponent(projectId)}/reports`);
  }

  exportPdf(projectId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.endpoint}/${encodeURIComponent(projectId)}/reports/pdf`, {
      responseType: 'blob', observe: 'response',
    });
  }
}
