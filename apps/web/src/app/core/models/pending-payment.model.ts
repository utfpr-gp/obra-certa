import { Expense } from './expense.model';

export interface PendingPayment {
  id: string;
  expenseId: string;
  expense?: Expense;
  dueDate: string;
  createdAt?: string;
}
