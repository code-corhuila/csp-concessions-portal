import { MoneyInCents } from './money';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface ProductRequest {
  name: string;
  description?: string;
  category?: string;
  price: MoneyInCents;
  availableStock?: number;
}

export interface Product extends ProductRequest {
  id: string;
  status: ProductStatus;
}
