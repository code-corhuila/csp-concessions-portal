import { ProductStatus } from './product';

export interface ComboItem {
  productId: string;
  quantity: number;
}

export interface ComboRequest {
  name: string;
  price: number;
  items: ComboItem[];
}

export interface Combo extends ComboRequest {
  id: string;
  status: ProductStatus;
}
