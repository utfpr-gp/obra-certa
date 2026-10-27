export interface ExpenseSupplier {
  id: string;
  name: string;
  document: string | null;
}

export interface ExpenseCreate {
  projectId: string;
  description: string;
  purchaseDate: string;
  categoryId: string;
  supplierId?: string;
  newSupplier?: { name: string; document: string };
  paid: boolean;
  valueMode: 'DIRECT' | 'CALCULATED';
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
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
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number;
}
