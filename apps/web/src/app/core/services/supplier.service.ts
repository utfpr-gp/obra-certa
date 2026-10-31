import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpenseSupplier } from '../models/expense-registration.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  getSuppliers(): Observable<ExpenseSupplier[]> {
    return this.http.get<ExpenseSupplier[]>(`${environment.apiUrl}/api/suppliers`);
  }
}
