import { TestBed } from '@angular/core/testing';
import { CatalogItem } from '../model/catalog-item';
import { moneyInCents } from '../model/money';
import { OrderDraftService } from './order-draft.service';

const popcorn: CatalogItem = {
  id: 'p1', kind: 'PRODUCT', name: 'Popcorn (large)', price: moneyInCents(500), status: 'PUBLISHED',
};
const combo: CatalogItem = {
  id: 'c1', kind: 'COMBO', name: 'Combo Familiar', price: moneyInCents(1200), status: 'PUBLISHED',
};

describe('OrderDraftService', () => {
  let draft: OrderDraftService;

  beforeEach(() => {
    draft = TestBed.inject(OrderDraftService);
  });

  it('starts empty with a zero total', () => {
    expect(draft.lines()).toEqual([]);
    expect(draft.total()).toBe(moneyInCents(0));
  });

  it('shows each selected item with its quantity and the computed total', () => {
    draft.add(popcorn, 2);
    draft.add(combo);

    expect(draft.lines().map(l => [l.item.name, l.quantity, l.subtotal])).toEqual([
      ['Popcorn (large)', 2, moneyInCents(1000)],
      ['Combo Familiar', 1, moneyInCents(1200)],
    ]);
    expect(draft.total()).toBe(moneyInCents(2200));
  });

  it('adds to the quantity when the same item is added again', () => {
    draft.add(popcorn);
    draft.add(popcorn, 2);

    expect(draft.lines().length).toBe(1);
    expect(draft.lines()[0].quantity).toBe(3);
    expect(draft.total()).toBe(moneyInCents(1500));
  });

  it('changes the quantity of a line and recomputes the total', () => {
    draft.add(popcorn);
    draft.setQuantity(popcorn.id, 4);

    expect(draft.total()).toBe(moneyInCents(2000));
  });

  it('removes a line and its amount', () => {
    draft.add(popcorn);
    draft.add(combo);
    draft.remove(popcorn.id);

    expect(draft.lines().map(l => l.item.id)).toEqual(['c1']);
    expect(draft.total()).toBe(moneyInCents(1200));
  });

  it('clears the order', () => {
    draft.add(popcorn);
    draft.clear();

    expect(draft.lines()).toEqual([]);
  });

  it('rejects a quantity that is not a positive integer', () => {
    for (const quantity of [0, -1, 1.5, NaN]) {
      expect(() => draft.add(popcorn, quantity)).toThrowError('Quantity must be a positive integer.');
    }
    draft.add(popcorn);
    expect(() => draft.setQuantity(popcorn.id, 0)).toThrowError('Quantity must be a positive integer.');
    expect(draft.lines()[0].quantity).toBe(1);
  });

  it('ignores a quantity change for an item that is not in the order', () => {
    draft.setQuantity('missing', 2);

    expect(draft.lines()).toEqual([]);
  });
});
