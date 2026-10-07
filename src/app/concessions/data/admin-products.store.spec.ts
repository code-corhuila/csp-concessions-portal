import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { AdminProductsStore } from './admin-products.store';

describe('AdminProductsStore', () => {
  let store: AdminProductsStore;

  beforeEach(() => {
    store = TestBed.inject(AdminProductsStore);
  });

  it('starts with the synthetic products, whatever their status', () => {
    expect(store.products().map(p => [p.name, p.status])).toEqual([
      ['Popcorn (large)', 'PUBLISHED'],
      ['Nachos with cheese', 'PUBLISHED'],
      ['Limited edition combo', 'INACTIVE'],
      ['Soda (medium)', 'DRAFT'],
    ]);
  });

  it('saves a new product as a draft with no stock', () => {
    store.create({ name: '  Hot dog ', category: 'Comida', price: moneyInCents(450) });

    const created = store.products().at(-1)!;
    expect(created.name).toBe('Hot dog');
    expect(created.status).toBe('DRAFT');
    expect(created.stock).toBe(0);
    expect(created.price).toBe(moneyInCents(450));
  });

  it('rejects an empty name', () => {
    expect(() => store.create({ name: '   ', category: 'Comida', price: moneyInCents(100) }))
      .toThrowError('El nombre es obligatorio.');
    expect(store.products().length).toBe(4);
  });

  it('rejects a price that is not a non-negative integer of cents', () => {
    for (const price of [-1, 1.5, NaN]) {
      expect(() => store.create({ name: 'Water', category: 'Bebida', price: price as never }))
        .toThrowError('El precio debe ser un monto no negativo.');
    }
    expect(store.products().length).toBe(4);
  });

  it('publishes a draft and deactivates a published product', () => {
    const draft = store.products().find(p => p.status === 'DRAFT')!;
    const published = store.products().find(p => p.status === 'PUBLISHED')!;

    store.publish(draft.id);
    store.deactivate(published.id);

    expect(store.products().find(p => p.id === draft.id)!.status).toBe('PUBLISHED');
    expect(store.products().find(p => p.id === published.id)!.status).toBe('INACTIVE');
  });

  it('ignores an id it does not know', () => {
    store.publish('missing');

    expect(store.products().length).toBe(4);
  });
});
