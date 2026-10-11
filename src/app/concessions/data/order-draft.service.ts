import { Injectable, computed, signal } from '@angular/core';
import { CatalogItem } from '../model/catalog-item';
import { MoneyInCents, moneyInCents } from '../model/money';

export interface OrderLine {
  item: CatalogItem;
  quantity: number;
  subtotal: MoneyInCents;
}

interface Selection {
  item: CatalogItem;
  quantity: number;
}

function assertPositiveInteger(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer.');
  }
}

/** The snack order the client is building: kept in memory, in the order the items were chosen. */
@Injectable({ providedIn: 'root' })
export class OrderDraftService {
  private readonly selections = signal<readonly Selection[]>([]);

  readonly lines = computed<OrderLine[]>(() =>
    this.selections().map(({ item, quantity }) => ({
      item,
      quantity,
      subtotal: moneyInCents(item.price * quantity),
    })),
  );

  readonly total = computed<MoneyInCents>(() =>
    moneyInCents(this.lines().reduce((sum, line) => sum + line.subtotal, 0)),
  );

  add(item: CatalogItem, quantity = 1): void {
    assertPositiveInteger(quantity);
    this.selections.update(current =>
      current.some(s => s.item.id === item.id)
        ? current.map(s => (s.item.id === item.id ? { ...s, quantity: s.quantity + quantity } : s))
        : [...current, { item, quantity }],
    );
  }

  setQuantity(itemId: string, quantity: number): void {
    assertPositiveInteger(quantity);
    this.selections.update(current => current.map(s => (s.item.id === itemId ? { ...s, quantity } : s)));
  }

  remove(itemId: string): void {
    this.selections.update(current => current.filter(s => s.item.id !== itemId));
  }

  clear(): void {
    this.selections.set([]);
  }
}
