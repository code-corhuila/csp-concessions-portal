import { MoneyInCents } from './money';
import { OrderItemType } from './order';
import { ProductStatus } from './product';

/** What the client sees when browsing: a product or a combo, reduced to what can be ordered. */
export interface CatalogItem {
  id: string;
  kind: OrderItemType;
  name: string;
  price: MoneyInCents;
  status: ProductStatus;
}
