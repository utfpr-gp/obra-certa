import { Budget } from './budget.model';
import { ExpenseCategory } from './expense-category.model';
import { PendingPayment } from './pending-payment.model';
import { Supplier } from './supplier.model';
import { User } from './user.model';

export interface Expense {
  id: string;
  budgetId: string;
  budget?: Budget;
  userId: string;
  user?: User;
  categoryId: string;
  category?: ExpenseCategory;
  supplierId?: string;
  supplier?: Supplier;
  type: string; // 'Material' | 'Mão de Obra' | 'Serviço' | string
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice: number;
  purchaseDate: string;
  receiptUrl?: string;
  nfeKey?: string;
  pendingPayment?: PendingPayment;
  createdAt?: string;
  updatedAt?: string;
}
