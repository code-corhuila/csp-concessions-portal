import { AdminProduct } from '../model/admin-product';
import { moneyInCents } from '../model/money';

/**
 * Cut 2 products of the administration area, burned into the portal: there is no Concessions
 * backend yet. The first three are the products of the customer dataset (same ids and prices) with
 * the stock the screens need; the draft shows the publish action. These are not real records.
 */
export const SYNTHETIC_ADMIN_PRODUCTS: readonly AdminProduct[] = [
  { id: '61000000-0000-0000-0000-000000000001', name: 'Popcorn (large)', category: 'Comida', price: moneyInCents(500), stock: 40, status: 'PUBLISHED', lastReason: 'Stock inicial' },
  { id: '61000000-0000-0000-0000-000000000002', name: 'Nachos with cheese', category: 'Comida', price: moneyInCents(350), stock: 25, status: 'PUBLISHED', lastReason: 'Stock inicial' },
  { id: '61000000-0000-0000-0000-000000000003', name: 'Limited edition combo', category: 'Comida', price: moneyInCents(990), stock: 0, status: 'INACTIVE', lastReason: 'Agotado' },
  { id: '61000000-0000-0000-0000-000000000004', name: 'Soda (medium)', category: 'Bebida', price: moneyInCents(400), stock: 0, status: 'DRAFT', lastReason: 'Producto creado' },
];
