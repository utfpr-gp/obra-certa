export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'vencimento' | 'estouro' | string;
  createdAt?: string;
}
