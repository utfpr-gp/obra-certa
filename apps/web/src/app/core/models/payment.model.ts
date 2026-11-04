export type PaymentUrgency = 'OVERDUE' | 'DUE_SOON' | 'REGULAR';

export interface PaymentAlertItem {
  expenseId: string;
  description: string;
  purchaseDate: string;
  dueDate: string;
  totalPrice: number;
  urgency: PaymentUrgency;
}

export interface PaymentAlerts {
  projectId: string;
  referenceDate: string;
  count: number;
  totalAmount: number;
  items: PaymentAlertItem[];
}
