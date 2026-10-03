import { ProductStatus } from './product';
import { MoneyInCents } from './money';

export interface ComboItem {
  productId: string;
  quantity: number;
}

export interface ComboRequest {
  name: string;
  price: MoneyInCents;
  items: ComboItem[];
}

export interface Combo extends ComboRequest {
  id: string;
  status: ProductStatus;
}
