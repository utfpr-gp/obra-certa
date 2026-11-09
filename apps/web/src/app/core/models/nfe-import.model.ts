export interface NfePreviewSupplier {
  name: string;
  document: string;
}

export interface NfePreviewItem {
  itemNumber: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface NfeImportItemChoice {
  itemNumber: number;
  categoryId: string;
}

export interface NfePreview {
  projectId: string;
  accessKey: string;
  issueDate: string;
  supplier: NfePreviewSupplier;
  items: NfePreviewItem[];
  total: number;
}
