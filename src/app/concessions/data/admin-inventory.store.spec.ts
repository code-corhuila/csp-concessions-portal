import { TestBed } from '@angular/core/testing';
import { AdminInventoryStore } from './admin-inventory.store';
import { AdminProductsStore } from './admin-products.store';

const POPCORN = '61000000-0000-0000-0000-000000000001';
const SODA = '61000000-0000-0000-0000-000000000004';

describe('AdminInventoryStore', () => {
  let store: AdminInventoryStore;
  let products: AdminProductsStore;

  const stockOf = (id: string): number => products.products().find(p => p.id === id)!.stock;

  beforeEach(() => {
    store = TestBed.inject(AdminInventoryStore);
    products = TestBed.inject(AdminProductsStore);
  });

  it('starts with the initial stock movements of the synthetic products, newest first', () => {
    expect(store.movements().map(m => [m.productName, m.quantityDelta, m.reason])).toEqual([
      ['Nachos with cheese', 25, 'Initial stock'],
      ['Popcorn (large)', 40, 'Initial stock'],
    ]);
  });

  it('adds stock and records the movement with its reason, newest first', () => {
    store.adjust({ productId: SODA, quantityDelta: 12, reason: ' Delivery ' });

    expect(stockOf(SODA)).toBe(12);
    expect(products.products().find(p => p.id === SODA)!.lastReason).toBe('Delivery');
    expect(store.movements()[0]).toEqual(jasmine.objectContaining({
      productId: SODA, productName: 'Soda (medium)', quantityDelta: 12, reason: 'Delivery',
    }));
  });

  it('takes stock out', () => {
    store.adjust({ productId: POPCORN, quantityDelta: -15, reason: 'Spoiled' });

    expect(stockOf(POPCORN)).toBe(25);
  });

  it('rejects an adjustment that would leave negative stock', () => {
    expect(() => store.adjust({ productId: POPCORN, quantityDelta: -41, reason: 'Spoiled' }))
      .toThrowError('El ajuste dejaría el stock en negativo.');
    expect(stockOf(POPCORN)).toBe(40);
    expect(store.movements().length).toBe(2);
  });

  it('rejects a zero or fractional quantity, an empty reason and an unknown product', () => {
    expect(() => store.adjust({ productId: POPCORN, quantityDelta: 0, reason: 'x' })).toThrowError('La cantidad debe ser un entero distinto de cero.');
    expect(() => store.adjust({ productId: POPCORN, quantityDelta: 1.5, reason: 'x' })).toThrowError('La cantidad debe ser un entero distinto de cero.');
    expect(() => store.adjust({ productId: POPCORN, quantityDelta: 1, reason: '  ' })).toThrowError('El motivo es obligatorio.');
    expect(() => store.adjust({ productId: 'missing', quantityDelta: 1, reason: 'x' })).toThrowError('El producto no existe.');
    expect(store.movements().length).toBe(2);
  });
});
