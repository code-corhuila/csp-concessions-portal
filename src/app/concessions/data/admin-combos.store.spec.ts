import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { AdminCombosStore } from './admin-combos.store';
import { AdminProductsStore } from './admin-products.store';

const POPCORN = '61000000-0000-0000-0000-000000000001';
const NACHOS = '61000000-0000-0000-0000-000000000002';
const INACTIVE = '61000000-0000-0000-0000-000000000003';
const DRAFT = '61000000-0000-0000-0000-000000000004';

describe('AdminCombosStore', () => {
  let store: AdminCombosStore;

  beforeEach(() => {
    store = TestBed.inject(AdminCombosStore);
  });

  it('starts with the synthetic combo', () => {
    expect(store.combos().map(c => [c.name, c.price, c.status])).toEqual([
      ['Combo Familiar', moneyInCents(1200), 'PUBLISHED'],
    ]);
  });

  it('names the components of a combo with their quantities', () => {
    expect(store.describe(store.combos()[0])).toBe('2× Popcorn (large), 1× Nachos with cheese');
  });

  it('saves a combo of published products as published', () => {
    store.create({ name: ' Pareja ', price: 900, items: [{ productId: POPCORN, quantity: 1 }, { productId: NACHOS, quantity: 1 }] });

    const created = store.combos().at(-1)!;
    expect(created.name).toBe('Pareja');
    expect(created.status).toBe('PUBLISHED');
    expect(created.price).toBe(moneyInCents(900));
  });

  it('rejects an empty name, a bad price and a combo with no components', () => {
    const items = [{ productId: POPCORN, quantity: 1 }];

    expect(() => store.create({ name: ' ', price: 900, items })).toThrowError('El nombre es obligatorio.');
    expect(() => store.create({ name: 'A', price: -1, items })).toThrowError('El precio debe ser un monto no negativo.');
    expect(() => store.create({ name: 'A', price: 900, items: [] })).toThrowError('Elige al menos un producto.');
    expect(store.combos().length).toBe(1);
  });

  it('rejects quantities that are not positive integers', () => {
    for (const quantity of [0, -2, 1.5]) {
      expect(() => store.create({ name: 'A', price: 900, items: [{ productId: POPCORN, quantity }] }))
        .toThrowError('Las cantidades deben ser enteros positivos.');
    }
  });

  it('rejects a product that is not published or does not exist', () => {
    for (const productId of [INACTIVE, DRAFT, 'missing']) {
      expect(() => store.create({ name: 'A', price: 900, items: [{ productId, quantity: 1 }] }))
        .toThrowError('Solo los productos publicados pueden formar un combo.');
    }
  });

  it('offers only the published products of the products store', () => {
    const products = TestBed.inject(AdminProductsStore);
    products.deactivate(NACHOS);

    expect(store.availableProducts().map(p => p.id)).toEqual([POPCORN]);
  });
});
