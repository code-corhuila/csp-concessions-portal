export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface ProductRequest {
  name: string;
  description?: string;
  category?: string;
  price: number;
  availableStock?: number;
}

export interface Product extends ProductRequest {
  id: string;
  status: ProductStatus;
}
