export interface ReportCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  plannedAmount: number;
  percentage: number;
}

export interface Report {
  projectId: string;
  projectName: string;
  totalPlanned: number;
  totalSpent: number;
  totalPaid: number;
  totalPending: number;
  categories: ReportCategory[];
}
