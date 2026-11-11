import { ExpenseCategory } from './expense-category.model';
import { User } from './user.model';

export interface SinapiReferences {
  source: string;
  finishes: { id: string; name: string; unitCost: number }[];
}

export interface SinapiAvailability {
  months: Record<string, string[]>;
}

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

export interface BudgetSetDTO {
  estimatedAmount: number;
}

/** Confirmação do lote SINAPI: custo exibido na prévia e percentuais em ordem do PRD. */
export interface SinapiConfirmDTO {
  uf: string;
  month: string;
  projectType: string;
  finishId: string;
  area: number;
  unitCost: number;
  percentages: { categoryId: string; percentage: number }[];
}

export interface SinapiConfirmation {
  created: { categoryId: string; categoryName: string; amount: number }[];
  preserved: { categoryId: string; categoryName: string }[];
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
