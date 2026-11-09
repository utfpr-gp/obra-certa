import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../models/report.model';

export interface ReportExport {
  report: Report;
  filename: string;
  generatedAt: string;
  from?: string | null;
  to?: string | null;
  categoryName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/projects`;

  get(projectId: string, from = '', to = ''): Observable<Report> {
    return this.http.get<Report>(`${this.endpoint}/${encodeURIComponent(projectId)}/reports`, { params: this.params(from, to) });
  }

  exportSnapshot(projectId: string, from = '', to = '', category = 'all'): Observable<ReportExport> {
    return this.http.get<ReportExport>(`${this.endpoint}/${encodeURIComponent(projectId)}/reports/export`, {
      params: { ...this.params(from, to), ...(category !== 'all' ? { category } : {}) },
    });
  }

  private params(from: string, to: string): Record<string, string> {
    return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
  }
}
