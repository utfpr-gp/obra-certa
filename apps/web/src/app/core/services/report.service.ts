import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../models/report.model';

export interface ReportExport {
  report: Report;
  filename: string;
  appendixPdf: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/projects`;

  get(projectId: string): Observable<Report> {
    return this.http.get<Report>(`${this.endpoint}/${encodeURIComponent(projectId)}/reports`);
  }

  exportSnapshot(projectId: string): Observable<ReportExport> {
    return this.http.get<ReportExport>(`${this.endpoint}/${encodeURIComponent(projectId)}/reports/export`);
  }
}
