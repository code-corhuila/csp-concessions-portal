import { CatalogItem } from '../model/catalog-item';
import { moneyInCents } from '../model/money';

/**
 * Cut 2 dataset of HU-FE-CONCESSIONS-001, burned into the portal: there is no Concessions backend
 * yet. Prices are integer cents. These are not real catalog records.
 */
export const SYNTHETIC_CATALOG: readonly CatalogItem[] = [
  { id: '61000000-0000-0000-0000-000000000001', kind: 'PRODUCT', name: 'Popcorn (large)', price: moneyInCents(500), status: 'PUBLISHED' },
  { id: '61000000-0000-0000-0000-000000000002', kind: 'PRODUCT', name: 'Nachos with cheese', price: moneyInCents(350), status: 'PUBLISHED' },
  { id: '61000000-0000-0000-0000-000000000003', kind: 'PRODUCT', name: 'Limited edition combo', price: moneyInCents(990), status: 'INACTIVE' },
  { id: '65000000-0000-0000-0000-000000000001', kind: 'COMBO', name: 'Combo Familiar', price: moneyInCents(1200), status: 'PUBLISHED' },
];
