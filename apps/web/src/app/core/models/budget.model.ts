import { ExpenseCategory } from './expense-category.model';
import { User } from './user.model';

export interface Budget {
  id: string;
  userId: string;
  user?: User;
  categoryId: string;
  category?: ExpenseCategory;
  estimatedAmount: number;
  createdAt?: string;
  updatedAt?: string;
}
