export interface ExpenseSupplier {
  id: string;
  name: string;
  document: string | null;
}

export interface ExpenseDeleteResponse {
  id: string;
  deleted: boolean;
  receiptDeletionFailed: boolean;
}

export interface ExpenseCreate {
  projectId: string;
  description: string;
  purchaseDate: string;
  categoryId: string;
  supplierId?: string;
  newSupplier?: { name: string; document?: string | null };
  paid: boolean;
  dueDate?: string;
  valueMode: 'DIRECT' | 'CALCULATED';
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  receiptExpected?: boolean;
}

export interface ExpenseResponse {
  id: string;
  projectId: string;
  description: string;
  purchaseDate: string;
  categoryId: string;
  categoryName: string;
  supplier: ExpenseSupplier;
  paid: boolean;
  dueDate: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number;
  receiptState: 'NONE' | 'PENDING' | 'UPLOADED';
  paidAt?: string | null;
  receiptDeletionFailed?: boolean;
}

export type ExpenseUpdate = Pick<ExpenseCreate,
  'description' | 'purchaseDate' | 'categoryId' | 'valueMode' | 'quantity' | 'unitPrice' | 'totalPrice' | 'paid' | 'dueDate'>;
