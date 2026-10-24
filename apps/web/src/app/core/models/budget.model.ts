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

export type BudgetState = 'ON_TRACK' | 'WARNING' | 'EXCEEDED' | 'NO_BUDGET';

export interface BudgetCategory {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  spentAmount: number;
  balanceAmount: number;
  percentage: number | null;
  state: BudgetState;
  hasBudget: boolean;
}

export interface BudgetOverview {
  projectId: string;
  totalPlanned: number;
  totalSpent: number;
  available: number;
  globalPercentage: number | null;
  exceededCategories: number;
  budgetedCategories: number;
  categories: BudgetCategory[];
}
