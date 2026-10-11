import { MoneyInCents } from './money';
import { ProductStatus } from './product';

/** What the administration sees of a product: the catalog fields plus its stock and last stock reason. */
export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: MoneyInCents;
  stock: number;
  status: ProductStatus;
  lastReason: string;
}

/** A product as typed in the form: the price is integer cents, validated by the store. */
export interface NewProduct {
  name: string;
  category: string;
  price: number;
}
