import { ExpenseCategory } from './expense-category.model';
import { Expense } from './expense.model';
import { PendingPayment } from './pending-payment.model';

export interface CategoryBudgetSummary {
  categoryId: string;
  categoryName: string;
  estimatedAmount: number;
  spentAmount: number;
  spentPercentage: number;
  isOverBudget: boolean;
  borderIndicatorColor: string;
}

export interface PendingPaymentSummary {
  id: string;
  expenseId: string;
  description: string;
  supplierName: string;
  amount: number;
  dueDateText: string;
  dueDate: string;
  status: 'hoje' | 'amanha' | 'futuro' | 'atrasado';
}

export interface RecentExpenseSummary {
  id: string;
  description: string;
  categoryName: string;
  amount: number;
  dateText: string;
  status: 'pago' | 'pendente';
}

export interface DashboardSummary {
  totalEstimated: number;
  totalSpent: number;
  availableBalance: number;
  spentPercentage: number;
  pendingBillsCount: number;
  dueTodayAlert?: {
    title: string;
    detail: string;
    amount: number;
    linkUrl?: string;
  };
  categories: CategoryBudgetSummary[];
  upcomingBills: PendingPaymentSummary[];
  recentExpenses: RecentExpenseSummary[];
}
