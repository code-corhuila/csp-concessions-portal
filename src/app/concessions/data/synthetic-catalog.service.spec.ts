import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { SyntheticCatalogService } from './synthetic-catalog.service';

describe('SyntheticCatalogService', () => {
  let service: SyntheticCatalogService;

  beforeEach(() => {
    service = TestBed.inject(SyntheticCatalogService);
  });

  it('lists the published products and combos with name and price in cents', () => {
    const items = service.listPublished();

    expect(items.map(i => [i.kind, i.name, i.price])).toEqual([
      ['PRODUCT', 'Popcorn (large)', moneyInCents(500)],
      ['PRODUCT', 'Nachos with cheese', moneyInCents(350)],
      ['COMBO', 'Combo Familiar', moneyInCents(1200)],
    ]);
  });

  it('keeps the ids of the dataset so an order can refer to them', () => {
    const ids = service.listPublished().map(i => i.id);

    expect(ids).toEqual([
      '61000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000002',
      '65000000-0000-0000-0000-000000000001',
    ]);
  });

  it('does not list an item whose status is not PUBLISHED', () => {
    const names = service.listPublished().map(i => i.name);

    expect(names).not.toContain('Limited edition combo');
  });
});
