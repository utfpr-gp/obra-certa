export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  userRole: UserRole;
  createdAt?: string;
  updatedAt?: string;
}
