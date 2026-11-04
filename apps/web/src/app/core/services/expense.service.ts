import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpenseCreate, ExpenseDeleteResponse, ExpenseResponse, ExpenseUpdate } from '../models/expense-registration.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/expenses`;

  static readonly receiptGuidance = 'Selecione um comprovante JPEG, PNG ou PDF de até 10 MB (10 MiB).';
  static validReceipt(file: File): boolean {
    const extensions: Record<string, RegExp> = {
      'image/jpeg': /\.jpe?g$/i, 'image/png': /\.png$/i, 'application/pdf': /\.pdf$/i,
    };
    return file.size > 0 && file.size <= 10485760 && !!extensions[file.type.toLowerCase()]?.test(file.name);
  }

  create(request: ExpenseCreate): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(this.endpoint, request);
  }

  update(id: string, request: ExpenseUpdate): Observable<ExpenseResponse> {
    return this.http.put<ExpenseResponse>(`${this.endpoint}/${encodeURIComponent(id)}`, request);
  }

  get(id: string): Observable<ExpenseResponse> {
    return this.http.get<ExpenseResponse>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }
  delete(id: string): Observable<ExpenseDeleteResponse> {
    return this.http.delete<ExpenseDeleteResponse>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }
  uploadReceipt(id: string, file: File): Observable<HttpEvent<ExpenseResponse>> {
    const form = new FormData(); form.append('file', file);
    return this.http.put<ExpenseResponse>(`${this.endpoint}/${encodeURIComponent(id)}/receipt`, form,
      {reportProgress: true, observe: 'events'});
  }

  downloadReceipt(id: string): Observable<Blob> {
    return this.http.get(`${this.endpoint}/${encodeURIComponent(id)}/receipt`, {responseType: 'blob'});
  }

  removeReceipt(id: string): Observable<ExpenseResponse> {
    return this.http.delete<ExpenseResponse>(`${this.endpoint}/${encodeURIComponent(id)}/receipt`);
  }
}
